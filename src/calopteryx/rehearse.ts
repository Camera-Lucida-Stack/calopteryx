// The private rehearsal: every item is tried against an exact, private copy of the live record before Lucy is asked
// to approve it. The copy is built by replaying the public log, entry by entry and at each entry's own time, into
// the platform's own in-memory archive (../ecdysis-core), and it is proved exact: every replayed entry must reproduce
// the hash the live log publishes for it. Nothing in a rehearsal leaves this machine; the only network use is reading
// the public log, and every other request is refused while a rehearsal runs.
//
// Until Calopteryx is registered, a stand-in Calopteryx is registered in the copy with a throwaway key, so the rules
// are exercised exactly but the ids of claims signed in a rehearsal differ from those the real key will give. Once
// registered, the real key signs in memory only, and the signed copy is discarded.
import { MemoryStore } from "../../../ecdysis-core/src/store/memory-store.js";
import { TransparencyLog, type LogEntryType } from "../../../ecdysis-core/src/core/log.js";
import { V2Service, MemoryV2Store } from "../../../ecdysis-core/src/api/v2/service.js";
import { Doorbells } from "../../../ecdysis-core/src/api/doorbells.js";
import { IssueRegistry, MemoryIssueStore } from "../../../ecdysis-core/src/api/v2/issues.js";
import { readFileSync } from "node:fs";
import { generateKeyPair, signJson, hashJson, API, type Json } from "./platform.js";

/** For tests only: a saved copy of the public log to rehearse against, offline. A rehearsal on it cannot support an approval. */
export const LOG_FIXTURE_ENV = "CALOPTERYX_LOG_FIXTURE";
export const logSource = () => process.env[LOG_FIXTURE_ENV] ? `fixture:${process.env[LOG_FIXTURE_ENV]}` : "live";

export interface LiveEntry { seq: number; ts: string; type: string; payloadHash: string; prevHash: string; entryHash: string; payload: Json }
export type Tier = "unverified" | "account" | "verified";
export interface RehearsalResult { type: string; status: number; body: Json; accepted: boolean; held: boolean }

const ZERO = "0".repeat(64);
const REFUSE_NETWORK: typeof fetch = async (input) => { throw new Error(`rehearsal: network refused (${String(input instanceof Request ? input.url : input)})`); };

/** The whole public log, newest included, with the hash chain checked as the log's own instructions describe. */
export async function fetchLiveLog(get: typeof fetch = fetch): Promise<LiveEntry[]> {
  const out: LiveEntry[] = [];
  const fixture = process.env[LOG_FIXTURE_ENV];
  if (fixture) out.push(...(JSON.parse(readFileSync(fixture, "utf8")) as { entries: LiveEntry[] }).entries);
  else for (let from = 0; ;) {
    const r = await get(`${API}/v2/log/entries?from=${from}&limit=200`);
    if (!r.ok) throw new Error(`reading the public log failed: ${r.status}`);
    const d = (await r.json()) as { entries: LiveEntry[]; next: number | null; treeSize: number };
    out.push(...d.entries);
    if (d.next === null || d.next === undefined || d.entries.length === 0 || out.length >= d.treeSize) break;
    from = d.next;
  }
  let prev = ZERO;
  for (const [i, e] of out.entries()) {
    if (e.seq !== i) throw new Error(`the public log has a gap at ${i}`);
    if (e.prevHash !== prev) throw new Error(`the public log's chain breaks at ${i}`);
    if (await hashJson({ seq: e.seq, ts: e.ts, type: e.type, payloadHash: e.payloadHash, prevHash: e.prevHash } as Json) !== e.entryHash) throw new Error(`entry ${i}'s hash does not match its contents`);
    if (await hashJson(e.payload) !== e.payloadHash) throw new Error(`entry ${i}'s words are withheld or altered, so the copy cannot be made exact`);
    prev = e.entryHash;
  }
  return out;
}

/** A private archive holding an exact copy of the given log. */
export async function privateCopy(entries: LiveEntry[]) {
  const store = new MemoryStore();
  let clock = new Date(entries[0]?.ts ?? Date.now());
  const now = () => clock;
  const log = new TransparencyLog(store, now);
  for (const e of entries) {
    clock = new Date(e.ts);
    const { entryHash } = await log.append(e.type as LogEntryType, e.payload);
    if (entryHash !== e.entryHash) throw new Error(`the private copy differs from the live log at entry ${e.seq}`);
  }
  clock = new Date(Math.max(Date.now(), clock.getTime() + 1000));
  const rows = () => (store as unknown as { log: Array<{ entry: { seq: number; ts: string; type: string }; payload: Json }> }).log
    .map((r) => ({ seq: r.entry.seq, ts: r.entry.ts, type: r.entry.type, payload: r.payload }));
  const adopted = [...entries].reverse().find((e) => e.type === "constitution.adopt")?.payload as { version: string; hash: string } | undefined;
  if (!adopted) throw new Error("the public log names no constitution in force");
  const constitution = { version: adopted.version, hash: adopted.hash };
  const logKey = await generateKeyPair();
  const v2 = new V2Service({ log, store: new MemoryV2Store(rows), logPrivateKey: logKey.privateKey, now,
    constitution: async () => constitution, pairing: async () => ({ ok: true, operatorId: "rehearsal:operator" }) });
  const doorbells = new Doorbells({ store, siteBase: "https://ecdysis.me", apiBase: API, sthPrivateKey: logKey.privateKey, sealSecret: "rehearsal",
    readOnly: false, fetchImpl: REFUSE_NETWORK, now, random: Math.random,
    // A stand-in email service that sends nothing, so an email doorbell can be rehearsed.
    email: { send: async () => ({ ok: true, id: "rehearsal" }), from: "Ecdysis doorbell <wake@notify.ecdysis.me>", replyTo: "rehearsal@invalid", dailyCap: 1000 },
    resolveAgent: async (handle) => { const a = (await v2.record()).agents.get(handle); return a ? { publicKey: a.publicKey, operatorId: a.operatorId } : null; } });
  const issues = new IssueRegistry({ store: new MemoryIssueStore(), v2, now });
  return { v2, doorbells, issues, constitution, size: entries.length, tick: () => { clock = new Date(clock.getTime() + 1000); } };
}
export type PrivateCopy = Awaited<ReturnType<typeof privateCopy>>;

/** Sends one item to the private copy, by the same route the live archive uses for its address. */
export async function submit(c: PrivateCopy, endpoint: string, body: Json): Promise<{ status: number; body: Json }> {
  const v2 = c.v2;
  c.tick();
  switch (endpoint) {
    case "/v2/agents/register": { const b = body as Record<string, unknown>; return v2.registerAgent({ handle: b["handle"], publicKey: b["publicKey"], operatorId: b["operatorId"], models: b["models"], pairing: b["pairing"], constitution: b["constitution"] }, "rehearsal"); }
    case "/v2/claims": return v2.publishClaim(body);
    case "/v2/claims/external": return v2.registerExternalClaim(body);
    case "/v2/claims/link": return v2.linkClaims(body);
    case "/v2/claims/unlink": return v2.unlinkClaims(body);
    case "/v2/claims/amend": return v2.amendClaim(body);
    case "/v2/submissions/withdraw": return v2.withdrawSubmission(body);
    case "/v2/checks": return v2.commitCheck(body);
    case "/v2/checks/result": return v2.fileResult(body);
    case "/v2/reviews": return v2.fileReview(body);
    case "/v2/arguments": return v2.fileArgument(body);
    case "/v2/arguments/check": return v2.checkArgument(body);
    case "/v2/arguments/answer": return v2.answerArgument(body);
    case "/v2/attempts": return v2.fileAttempt(body);
    case "/v2/attempts/clear": return v2.clearAttempt(body);
    case "/v2/issues": return c.issues.flag(body);
    case "/v2/keys/delegate": return v2.delegateKey(body);
    case "/v2/keys/revoke": return v2.revokeKey(body);
    case "/v2/agents/doorbell": return c.doorbells.request(body);
    default: return { status: 404, body: { error: `no rehearsal route for ${endpoint}` } };
  }
}

/**
 * Who signs in the copy. If the handle is not yet on the live record, a stand-in is registered under a private operator
 * at the tier given (by default "account", which a pairing code gives). Otherwise the real key signs, in memory only.
 */
export async function signer(c: PrivateCopy, handle: string, models: string[], tier: Tier, realKey: () => { publicKey: string; privateKey: string }) {
  if ((await c.v2.record()).agents.has(handle)) return { ...realKey(), standIn: false };
  const kp = await generateKeyPair();
  const r = await c.v2.registerAgent({ handle, publicKey: kp.publicKey, operatorId: "rehearsal:operator", models, constitution: c.constitution }, "rehearsal");
  if (r.status !== 201) throw new Error(`the stand-in could not be registered in the copy: ${JSON.stringify(r.body)}`);
  if (tier !== "unverified") await c.v2.setTier("rehearsal:operator", tier, "rehearsal");
  return { ...kp, standIn: true };
}

/** Runs fn with every network request refused, so nothing in a rehearsal can reach the outside world. */
export async function offline<T>(fn: () => Promise<T>): Promise<T> {
  const real = globalThis.fetch;
  globalThis.fetch = REFUSE_NETWORK;
  try { return await fn(); } finally { globalThis.fetch = real; }
}

export async function rehearseOne(c: PrivateCopy, endpoint: string, payload: Record<string, any>, key: { publicKey: string; privateKey: string } | null): Promise<RehearsalResult> {
  let body: Json;
  if (!key) body = payload as Json;
  else {
    const p = { ...payload, agent: { ...payload.agent, publicKey: key.publicKey } } as Json;
    body = { payload: p, signature: await signJson(key.privateKey, p) } as Json;
  }
  const r = await offline(() => submit(c, endpoint, body));
  // A 202 is a hold only when the reply says so: "held" for a human decision (R1), or "under-review" by the stewards.
  // A flag's 202 means only that the stewards received it.
  const status = (r.body as { status?: unknown } | null)?.status;
  const held = r.status === 202 && (status === "held" || status === "under-review");
  return { type: payload.type ?? "agent.register", status: r.status, body: r.body, accepted: r.status >= 200 && r.status < 300 && !held, held };
}

/** The one refusal a rehearsal of a cross-checked result cannot avoid: the earlier receipt's outputs are withheld from the
 * public log until a cross-check is filed, so the private copy never holds them, and the archive stops at its comparison
 * (ecdysis-core src/api/v2/service.ts, check.result). Every check before that comparison has passed by then. */
export const CROSS_CHECK_UNREHEARSABLE = "the cross-checked receipt's outputs are missing";

/** True only for that refusal, of a check.result that reports a cross-check: status 500 and exactly that message. */
export function crossCheckUnrehearsable(p: Record<string, any>, r: { accepted?: boolean; status?: number; body?: unknown }): boolean {
  return p.type === "check.result" && typeof p.crossCheck?.receipt === "string" && r.accepted === false && r.status === 500
    && (r.body as { error?: unknown } | null)?.error === CROSS_CHECK_UNREHEARSABLE;
}

/** Why the rehearsal cannot support an approval, or null. That one refusal is accepted only with Lucy's written reasons
 * (approve --rehearsal-override "<reasons>"); every other refusal blocks, whatever the override. */
export function rehearsalRefusal(p: Record<string, any>, r: { accepted?: boolean; status?: number; body?: unknown }, override?: string): string | null {
  if (r.accepted) return null;
  const why = `the copy refused it (${r.status}): ${JSON.stringify(r.body).slice(0, 300)}`;
  if (!crossCheckUnrehearsable(p, r)) return why;
  return override?.trim() && !override.startsWith("--") ? null
    : `${why}. Only the live archive can compare the cross-checked outputs; to approve regardless, add --rehearsal-override "<Lucy's reasons>"`;
}
