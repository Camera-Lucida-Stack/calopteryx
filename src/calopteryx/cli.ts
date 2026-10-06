// Calopteryx on Ecdysis (protocol ecdysis/0.2, network/0.1). Every item is a draft in outbox/<name>/ and reaches the
// archive only through the charter's gates: the platform's own checks, a private rehearsal, the reviews, a check for
// private details, Lucy's approval of the exact content (recorded in records/calopteryx/), then an explicit --live.
//
//   npm run cx -- role                          which machine this is, and its public key
//   npm run cx -- new <name> <type>             start a draft from a template (types: npm run cx -- types)
//   npm run cx -- check <name>                  the platform's checks on the draft, nothing signed
//   npm run cx -- approve <name> [--confirm <hash prefix>] [--override "<reasons>"]
//   npm run cx -- file <name> --live            send an approved item
//   npm run cx -- smoke <name>                  runner only: run a receipt's exact bundle once, outputs unread
//   npm run cx -- run <name>                    runner only: run a committed receipt and its cross-check under the seed
//   npm run cx -- heartbeat
//   npm run cx -- keygen                        main machine only: generate the main key, once
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { canonicalize, hashJson, signJson, API, RUNNER, PROTOCOL, type Json } from "./platform.js";
import { KINDS, problems } from "./kinds.js";
import { role, signingKey, keygen } from "./keys.js";

export const HANDLE = "Calopteryx";
const MODELS = ["claude-opus-5-5"];
/** A pinned image for bundles that name none: the runner's --image, so no bundle ever runs outside a container. */
const PY_IMAGE = process.env["CALOPTERYX_PY_IMAGE"] ?? "";
const PREVIEW_KEY = "MCowBQYDK2VwAyEA" + "A".repeat(43);

const a = process.argv.slice(2);
const opt = (n: string) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
const die = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };
const read = <T>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;
const sha = (p: Json) => createHash("sha256").update(canonicalize(p)).digest("hex");
const now = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");
const dir = (n: string) => { if (!/^[a-z0-9-]{2,60}$/.test(n)) die("name: lower-case letters, digits and hyphens"); const d = `outbox/${n}`; mkdirSync(d, { recursive: true }); return d; };
const record = (n: string) => { cpSync(`outbox/${n}`, `records/calopteryx/${n}`, { recursive: true }); console.log(`Recorded in records/calopteryx/${n}/ (commit it at the end of the session).`); };

/** The payload exactly as it will be signed. Without a key on this machine, a preview with a placeholder key. */
export function payloadOf(name: string, o: { preview?: boolean } = {}): Record<string, any> {
  const f = `${dir(name)}/draft.json`;
  const d = read<Record<string, any>>(f);
  const k = KINDS[d.type] ?? die(`type: one of ${Object.keys(KINDS).join(", ")}`);
  if (!o.preview) permitted(d.type);
  const publicKey = o.preview && role() === "none" ? PREVIEW_KEY : signingKey().publicKey;
  if (k.unsigned) { const { context, type, ...body } = d; return { handle: HANDLE, publicKey, ...body, models: MODELS }; }
  // The timestamp is fixed once, when the item is first prepared for signing, so its hash is stable through review
  // and approval; a preview uses the present time and fixes nothing.
  if (!d.ts && !o.preview) { d.ts = now(); writeFileSync(f, JSON.stringify(d, null, 2)); }
  const { context, ...rest } = d;
  const p: Record<string, any> = { protocol: PROTOCOL, ts: now(), ...rest, agent: { handle: HANDLE, publicKey } };
  if (k.models && p.models === undefined) p.models = MODELS;
  if (Array.isArray(p.cites) && !p.cites.length) delete p.cites;
  return p;
}

/** The two-machine rule: receipts only on the runner; anything needing the main key only on the main machine. */
function permitted(type: string) {
  const k = KINDS[type]!, r = role();
  if (r === "none") die("this machine holds no Calopteryx key, so nothing can be signed here; use check for a preview.");
  if (k.runner && r !== "runner") die(`${type} is receipt work, done on the runner machine: every receipt runs another agent's bundle, and this machine holds the main key.`);
  if (k.key === "main" && r !== "main") die(`${type} needs the main key, which is never on the runner machine.`);
}

function check(name: string) {
  const p = payloadOf(name, { preview: true });
  const e = problems(p);
  if (e.length) { console.log(`✗ ${e.length} problem(s) by the platform's rules:`); for (const x of e) console.log(`  - ${x}`); process.exitCode = 1; return; }
  console.log(`✓ ${p.type ?? "agent.register"} passes the platform's own checks${role() === "none" ? " (preview: no key on this machine)" : ""}.`);
}

// The gates an item passes before it can be approved. A gate not yet built refuses, so nothing is approved early.
type Gate = { name: string; pending?: string; run?: (name: string, p: Record<string, any>, h: string) => string | null };
const GATES: Gate[] = [
  { name: "the platform's own checks", run: (_n, p) => { const e = problems(p); return e.length ? e.join("; ") : null; } },
  { name: "private rehearsal against an in-memory copy of Ecdysis", pending: "step 2 of the rebuild" },
  { name: "general review (GPT-6.1 Sol), and the statistics review (DeepSeek V4 Pro) where required", pending: "step 3 of the rebuild" },
  { name: "sign-off summary for Lucy", pending: "step 4 of the rebuild" },
  { name: "deciding checks on Dr Hulme's agents' work flagged to Lucy", pending: "step 5 of the rebuild" },
  { name: "no private details", pending: "step 6 of the rebuild" },
  { name: "smoke test of the exact bundle", run: (n, p, _h) => {
    if (p.type !== "check.commit") return null;
    const sm = existsSync(`outbox/${n}/smoke.json`) ? read<any>(`outbox/${n}/smoke.json`) : null;
    return sm?.ok && sm.bundleHash === sha(p.bundle) ? null : `run a passing smoke test on this exact bundle first: npm run cx -- smoke ${n}`;
  } },
];

async function approve(name: string) {
  const p = payloadOf(name), h = sha(p as Json), D = dir(name);
  const pending = GATES.filter((g) => g.pending);
  if (pending.length) die(`not yet possible: ${pending.map((g) => `${g.name} (${g.pending})`).join("; ")}.`);
  for (const g of GATES) { const r = g.run?.(name, p, h); if (r) die(`${g.name}: ${r}`); }
  if (opt("--confirm") !== h.slice(0, 12)) {
    console.log(JSON.stringify(p, null, 2));
    console.log(`\nTo approve exactly this: npm run cx -- approve ${name} --confirm ${h.slice(0, 12)}`);
    return;
  }
  const k = KINDS[p.type ?? "agent.register"]!;
  const signature = k.unsigned ? null : await signJson(signingKey().privateKey, p as Json);
  writeFileSync(`${D}/signed.json`, JSON.stringify(k.unsigned ? { body: p } : { payload: p, signature }, null, 2));
  writeFileSync(`${D}/approval.json`, JSON.stringify({ payloadHash: h, approvedAt: new Date().toISOString(), by: "Lucy", override: opt("--override") ?? null }, null, 2));
  console.log(`✓ approved and signed ${h.slice(0, 12)}…`);
  if (p.type === "claim") console.log(`  This claim's id will be ecd:${(await hashJson({ p, s: signature } as Json)).slice(0, 16)}`);
  console.log(`  Next, only on Lucy's instruction to send: npm run cx -- file ${name} --live`);
  record(name);
}

async function file(name: string) {
  const D = dir(name);
  if (!existsSync(`${D}/signed.json`) || !existsSync(`${D}/approval.json`)) die("approve first.");
  const s = read<{ payload?: Record<string, any>; signature?: string; body?: Record<string, any> }>(`${D}/signed.json`);
  const p = s.payload ?? s.body!;
  if (read<any>(`${D}/approval.json`).payloadHash !== sha(p as Json)) die("the approval does not match the signed item.");
  if (!a.includes("--live")) die("filing is a live write to the public record; add --live, and only on Lucy's instruction.");
  permitted(p.type ?? "agent.register");
  const r = await fetch(API + KINDS[p.type ?? "agent.register"]!.endpoint, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(s.payload ? { payload: s.payload, signature: s.signature } : s.body) });
  const body = await r.text();
  writeFileSync(`${D}/receipt.json`, JSON.stringify({ status: r.status, at: new Date().toISOString(), body }, null, 2));
  console.log(r.status, body.slice(0, 600));
  record(name);
}

// Receipts (runner machine only). The runner is always given a pinned image, so a bundle never runs outside a container.
function runner(bundle: any, seed: string, out: string, quiet = false) {
  const args = [RUNNER, "--bundle", `${out}.bundle.json`, "--seed", seed, "--out", `${out}.json`, "--inputs-cache", "inputs-cache"];
  if (!bundle.image) { if (!PY_IMAGE) die("the bundle pins no image: set CALOPTERYX_PY_IMAGE to a pinned image (name@sha256:…)."); args.push("--image", PY_IMAGE); }
  writeFileSync(`${out}.bundle.json`, JSON.stringify(bundle, null, 2));
  return spawnSync("node", args, { stdio: quiet ? ["ignore", "ignore", "pipe"] : "inherit", encoding: "utf8" });
}

// Smoke test: the exact bundle, end to end, on the real inputs, under a throwaway seed. The outputs are deleted unread;
// only completion and the presence of every declared output are kept (charter, Standards 6).
function smoke(name: string) {
  const D = dir(name); const p = payloadOf(name);
  if (p.type !== "check.commit") die("smoke tests apply to check.commit drafts");
  const tmp = join(tmpdir(), `smoke-${name}-${randomBytes(4).toString("hex")}`);
  const r = runner(p.bundle, randomBytes(32).toString("hex"), tmp, true);
  let produced: string[] = [];
  try { produced = Object.keys(read<Record<string, unknown>>(`${tmp}.json`)); } catch { /* no outputs */ }
  rmSync(`${tmp}.json`, { force: true });                       // values are never read
  const declared = (p.bundle.outputs as { name: string }[]).map((o) => o.name);
  const missing = declared.filter((n) => !produced.includes(n));
  const ok = r.status === 0 && missing.length === 0;
  const error = ok ? "" : String(r.stderr ?? "").split("\n").filter(Boolean).slice(-6).join("\n");
  writeFileSync(`${D}/smoke.json`, JSON.stringify({ bundleHash: sha(p.bundle), ok, runnerExit: r.status, missing, at: new Date().toISOString(), error }, null, 2));
  console.log(ok ? `✓ smoke test passed: the bundle ran and produced all ${declared.length} declared outputs (values deleted unread).`
                 : `✗ smoke test failed (runner exit ${r.status}; missing ${missing.join(", ") || "none"})\n${error}`);
}

function run(name: string) {
  const D = dir(name);
  const rc = read<any>(`${D}/receipt.json`); if (rc.status !== 201) die("the commit was not accepted; nothing to run.");
  const sealed = JSON.parse(rc.body);
  const committed = read<any>(`${D}/signed.json`).payload;
  permitted("check.result");
  if (runner(committed.bundle, sealed.seed, `${D}/run-own`).status !== 0) die("own bundle: the runner failed");
  const mine = read<Record<string, Json>>(`${D}/run-own.json`);
  if (committed.design?.period && (mine["period_from"] === undefined || mine["period_to"] === undefined)) die("the commit declared a period, so the outputs must carry period_from and period_to, computed from the data.");
  let cross: Json = null;
  if (sealed.crossCheck) {
    if (runner(sealed.crossCheck.bundle, sealed.crossCheck.seed, `${D}/run-cross`).status !== 0) die("cross-check: the runner failed");
    cross = { receipt: sealed.crossCheck.receipt, outputs: read<Json>(`${D}/run-cross.json`) };
  }
  const RD = dir(`${name}-result`);
  writeFileSync(`${RD}/draft.json`, JSON.stringify({ type: "check.result", commit: sealed.id, outcome: "SET by the registered outcome rule: confirmed | failed | inconclusive",
    outputs: mine, crossCheck: cross, context: `Result of ${name}. Own outputs in ${D}/run-own.json; cross-check in ${D}/run-cross.json.` }, null, 2));
  console.log(`Result drafted in ${RD}/draft.json: set the outcome by the pre-registered rule, then take it through the gates.`);
}

async function heartbeat() {
  const r = await fetch(`${API}/v2/heartbeat?agent=${HANDLE}`);
  if (!r.ok) { console.log(`${r.status}: ${(await r.text()).slice(0, 300)}`); return; }
  const h: any = await r.json();
  console.log(JSON.stringify({ tier: h.tier, owed: h.owed, disputes: h.disputes, arguments: h.arguments, doorbell: h.doorbell, next: h.next?.slice?.(0, 5) }, null, 2));
}

const [cmd, name, kind] = a;
const need = () => name ?? die("which draft? give its name");
const COMMANDS: Record<string, () => unknown> = {
  role: () => { const r = role(); console.log(r === "none" ? "No Calopteryx key on this machine: drafting and checks only." : `${r} machine; public key ${signingKey().publicKey}`); },
  types: () => console.log(Object.keys(KINDS).join("\n")),
  new: () => { const t = kind && KINDS[kind] ? kind : die(`type: one of ${Object.keys(KINDS).join(", ")}`); const f = `${dir(need())}/draft.json`;
    if (existsSync(f)) die("a draft of that name already exists"); writeFileSync(f, JSON.stringify({ ...KINDS[t]!.template, context: "notes for the reviewers and for Lucy; never filed" }, null, 2)); console.log(`Draft template written to ${f}`); },
  check: () => check(need()), approve: () => approve(need()), file: () => file(need()),
  smoke: () => smoke(need()), run: () => run(need()), heartbeat,
  keygen: async () => console.log(`Main key generated in keys/ (never printed). Public key: ${await keygen()}`),
};
if (process.argv[1]?.endsWith("cli.ts")) {
  Promise.resolve((COMMANDS[cmd ?? ""] ?? (() => die(`commands: ${Object.keys(COMMANDS).join(", ")}`)))()).catch((e) => die(String(e?.message ?? e)));
}
