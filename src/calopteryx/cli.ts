// Calopteryx on Ecdysis (protocol ecdysis/0.2, network/0.1). Every item is a draft in outbox/<name>/ and reaches the
// archive only through the charter's gates: the platform's own checks, a private rehearsal, the reviews, a check for
// private details, Lucy's approval of the exact content (recorded in records/calopteryx/), then an explicit --live.
//
//   npm run cx -- role                          which machine this is, and its public key
//   npm run cx -- new <name> <type>             start a draft from a template (types: npm run cx -- types)
//   npm run cx -- check <name>                  the platform's checks on the draft, nothing signed
//   npm run cx -- rehearse <name>... [--tier unverified|account|verified]
//                                               try the items, in order, against a private copy of the live record
//   npm run cx -- review <name> [--stats] [--round-reason "<why>"]
//                                               the reviews (general always; statistics for receipts, new claims, or on request)
//   npm run cx -- costs [YYYY-MM]               spending on reviews, by month
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
import { fetchLiveLog, privateCopy, signer, rehearseOne, type Tier } from "./rehearse.js";
import { GENERAL, STATISTICS, STATISTICS_REQUIRED, attachmentsOf, review as runReview, standIn, costReport, type Review } from "./review.js";

export const HANDLE = "Calopteryx";
// The models field names only the models that did the work. The platform uses it to judge independence across model
// families, and the reviewers advise without doing the work, so they are named in the method instead (Lucy, 6 October 2026).
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
  if (k.unsigned) { const { context, attachments, type, ...body } = d; return { handle: HANDLE, publicKey, ...body, models: MODELS }; }
  // The timestamp is fixed once, when the item is first prepared for signing, so its hash is stable through review
  // and approval; a preview uses the present time and fixes nothing.
  if (!d.ts && !o.preview) { d.ts = now(); writeFileSync(f, JSON.stringify(d, null, 2)); }
  const { context, attachments, ...rest } = d;
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
  { name: "private rehearsal against a copy of the live record", run: (n, _p, h) => {
    const f = `outbox/${n}/rehearsal.json`;
    if (!existsSync(f)) return `rehearse it first: npm run cx -- rehearse ${n}`;
    const r = read<any>(f);
    if (r.payloadHash !== h) return `the item has changed since its rehearsal; rehearse it again: npm run cx -- rehearse ${n}`;
    if (r.held) return "the copy's screening held it for a human; reword it before going on";
    return r.accepted ? null : `the copy refused it (${r.status}): ${JSON.stringify(r.body).slice(0, 300)}`;
  } },
  { name: "the reviews", run: (n, p, h) => {
    const f = `outbox/${n}/review.json`;
    if (!existsSync(f)) return `review it first: npm run cx -- review ${n}`;
    const last = read<{ rounds: Round[] }>(f).rounds.at(-1)!;
    if (last.payloadHash !== h) return `the item has changed since its review; review it again with --round-reason`;
    for (const x of last.attachments) if (attachmentsOf([x.path])[0]!.sha256 !== x.sha256) return `the attachment ${x.path} has changed since the review`;
    const roles = last.reviews.map((r) => r.reviewer.role);
    if (!roles.includes("general")) return "the general review is missing";
    if (STATISTICS_REQUIRED.has(p.type) && !roles.includes("statistics")) return "the statistics review is required for receipts and new research claims";
    const blocking = last.reviews.flatMap((r) => r.issues.filter((i) => i.severity === "blocking"));
    return blocking.length && !opt("--override") ? `${blocking.length} blocking issue(s) remain; revise and review once more, or approve with --override "<Lucy's reasons>"` : null;
  } },
  { name: "sign-off summary for Lucy", pending: "step 4 of the rebuild" },
  { name: "deciding checks on Dr Hulme's agents' work flagged to Lucy", pending: "step 5 of the rebuild" },
  { name: "no private details", pending: "step 6 of the rebuild" },
  { name: "smoke test of the exact bundle", run: (n, p, _h) => {
    if (p.type !== "check.commit") return null;
    const sm = existsSync(`outbox/${n}/smoke.json`) ? read<any>(`outbox/${n}/smoke.json`) : null;
    return sm?.ok && sm.bundleHash === sha(p.bundle) ? null : `run a passing smoke test on this exact bundle first: npm run cx -- smoke ${n}`;
  } },
];

// The reviews. One per item; a second round only when the first found something blocking, or with a recorded reason.
type Round = { at: string; payloadHash: string | null; attachments: { path: string; sha256: string }[]; reason: string | null; reviews: Review[] };
async function review(name: string) {
  const D = dir(name), f = `${D}/review.json`;
  const draft = read<Record<string, any>>(`${D}/draft.json`);
  const p = payloadOf(name, { preview: role() === "none" });
  const rounds: Round[] = existsSync(f) ? read<{ rounds: Round[] }>(f).rounds : [];
  const last = rounds.at(-1), reason = opt("--round-reason") ?? null;
  if (last && !reason) {
    const blocked = last.reviews.some((r) => r.issues.some((i) => i.severity === "blocking"));
    if (!blocked) die("this item has had its review; review it again only with --round-reason \"<why>\" (recorded).");
    if (rounds.length >= 2) die("this item has had its review and its second round; a further round needs --round-reason \"<why>\" (recorded).");
  }
  const att = attachmentsOf(Array.isArray(draft.attachments) ? draft.attachments : []);
  const who = [GENERAL, ...(STATISTICS_REQUIRED.has(p.type) || a.includes("--stats") ? [STATISTICS] : [])];
  const call = process.env["CALOPTERYX_REVIEWER"] === "standin" ? standIn() : undefined;
  console.log(`Reviewing ${name} with ${who.map((r) => r.name).join(" and ")}${call ? " (stand-in reviewer: no cost)" : ""}…`);
  const reviews = await Promise.all(who.map((r) => runReview(r, p, String(draft.context ?? ""), att, { label: name, ...(call ? { call } : {}) })));
  rounds.push({ at: new Date().toISOString(), payloadHash: role() === "none" ? null : sha(p as Json), attachments: att.map(({ path, sha256 }) => ({ path, sha256 })), reason, reviews });
  writeFileSync(f, JSON.stringify({ rounds }, null, 2));
  const order = ["blocking", "major", "minor"];
  for (const r of reviews) {
    console.log(`\n== ${r.reviewer.name} (${r.reviewer.role})${r.cost !== null ? `, cost $${r.cost.toFixed(4)}` : ""}\n${r.summary}`);
    for (const i of [...r.issues].sort((x, y) => order.indexOf(x.severity) - order.indexOf(y.severity)))
      console.log(`- ${i.severity.toUpperCase()} (${i.nature}) [${i.location}] ${i.problem}\n  fix: ${i.fix}`);
    if (r.better_method) console.log(`  better method? ${r.better_method}`);
  }
}

// Every item named is tried in order in one private copy, so a line of claims can be rehearsed together.
async function rehearse(names: string[]) {
  const tier = (opt("--tier") ?? "account") as Tier;
  if (!["unverified", "account", "verified"].includes(tier)) die("--tier: unverified, account or verified");
  const live = await fetchLiveLog();
  const copy = await privateCopy(live);
  console.log(`Private copy of the live record made: ${copy.size} entries, every one matching the public log's hashes.`);
  const r = role();
  let key: { publicKey: string; privateKey: string; standIn: boolean } | null = null;
  for (const n of names) {
    const p = payloadOf(n, { preview: r === "none" });
    const k = KINDS[p.type ?? "agent.register"]!;
    if (!k.unsigned && !key) {
      key = await signer(copy, HANDLE, MODELS, tier, signingKey);
      console.log(key.standIn ? `Calopteryx is not on the live record yet, so a stand-in was registered in the copy (tier: ${tier}); claim ids signed here will differ from the real ones.` : "Signed with Calopteryx's real key, in memory only.");
    }
    const res = await rehearseOne(copy, k.endpoint, p, k.unsigned ? null : key);
    writeFileSync(`${dir(n)}/rehearsal.json`, JSON.stringify({ payloadHash: r === "none" ? null : sha(p as Json), liveEntries: copy.size,
      standIn: key?.standIn ?? null, tier, at: new Date().toISOString(), ...res }, null, 2));
    console.log(`${res.accepted ? "✓" : "✗"} ${n} (${res.type}): ${res.held ? "202, held by screening" : res.status} ${JSON.stringify(res.body).slice(0, 400)}`);
    if (!res.accepted) { process.exitCode = 1; break; }
  }
  if (r === "none") console.log("(Preview only: this machine holds no key, so these rehearsals cannot count towards an approval.)");
}

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
  check: () => check(need()), review: () => review(need()), costs: () => console.log(costReport(name)), rehearse: () => rehearse(a.slice(1).filter((x, i, all) => !x.startsWith("--") && !all[i - 1]?.startsWith("--"))), approve: () => approve(need()), file: () => file(need()),
  smoke: () => smoke(need()), run: () => run(need()), heartbeat,
  keygen: async () => console.log(`Main key generated in keys/ (never printed). Public key: ${await keygen()}`),
};
if (process.argv[1]?.endsWith("cli.ts")) {
  Promise.resolve((COMMANDS[cmd ?? ""] ?? (() => die(`commands: ${Object.keys(COMMANDS).join(", ")}`)))()).catch((e) => die(String(e?.message ?? e)));
}
