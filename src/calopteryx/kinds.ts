// Every kind of filing Calopteryx can make: where it is sent, which key may sign it, a template for a new
// draft, and the platform's own checks on it. Templates follow docs/skill.md (protocol/skill-2026-10-06.md).
import {
  validateClaim, validateReviewV2, validateArgumentV2, validateArgumentCheckV2, validateArgumentAnswerV2,
  validateAttemptV2, validateAttemptClearV2, validateLinkV2, validateUnlinkV2, validateCheckCommit,
  validateCheckResult, validateFlagV2, parseSource, workProblems, PROTOCOL, type Json,
} from "./platform.js";

/** "main": only the main key may sign it. "report": the main key or a check key (receipts, reviews, attempts, argument checks). */
export type KeyScope = "main" | "report";

export interface Kind {
  endpoint: string;
  key: KeyScope;
  /** A receipt step: signed and run only on the runner machine, because every receipt runs another agent's bundle. */
  runner?: boolean;
  /** Declares the models used (models?), filled in by the tool unless the draft names them. */
  models?: boolean;
  /** Registration is plain JSON with no envelope. */
  unsigned?: boolean;
  template: Record<string, Json>;
  validate: (p: unknown) => string[];
}

type Res = { ok: true } | { ok: false; errors: string[] };
/** The reference runner's limit on outputs, period_from and period_to included (ecdysis-core scripts/runner/ecdysis-run.mjs). */
export const RUNNER_MAX_OUTPUTS = 20;
const errorsOf = (f: (p: unknown) => Res) => (p: unknown) => { const r = f(p); return r.ok ? [] : r.errors; };
const len = (v: unknown, name: string, min: number, max: number) =>
  typeof v === "string" && v.trim().length >= min && v.length <= max ? [] : [`${name}: ${min} to ${max} characters`];

// Rules the archive applies inside its service, where no separate check is exported; the private rehearsal applies them all.
function externalProblems(p: unknown): string[] {
  const x = p as Record<string, any>;
  const e: string[] = [];
  if (x.type !== "claim.external") e.push('type: "claim.external"');
  const src = parseSource(x.source);
  if (!src.ok) e.push(`source: ${src.error}`);
  if (x.work !== undefined) e.push(...workProblems(x.work, new Date().getUTCFullYear()));
  else if (src.ok && src.scheme === "cite") e.push("work: a cite: source must carry its citation {title, authors, year, venue?}");
  e.push(...len(x.quote, "quote", 10, 600), ...len(x.test, "test", 10, 600));
  if (x.kind !== undefined && x.kind !== "empirical" && x.kind !== "conceptual") e.push('kind: "empirical" or "conceptual"');
  if ((x.kind ?? "empirical") === "empirical") {
    if (!x.scope) e.push("scope: an empirical claim from the literature declares the paper's scope");
    if (!x.fidelity) e.push('fidelity: {as: "reported" | "adapted", basis}');
  }
  return e;
}
function doorbellProblems(p: unknown): string[] {
  const x = p as Record<string, any>;
  if (x.type === "doorbell.stop") return [];
  const e: string[] = [];
  if (x.kind !== "email") e.push('kind: "email" (the operator chose an email alert, 6 October 2026)');
  if (x.cadence !== "weekly") e.push('cadence: "weekly" (the operator chose a weekly reminder, 6 October 2026)');
  return e;
}
const KEY_B64 = /^MCowBQYDK2VwAyEA[A-Za-z0-9_-]{43}$/;

export const KINDS: Record<string, Kind> = {
  claim: {
    endpoint: "/v2/claims", key: "main", models: true, validate: errorsOf(validateClaim),
    template: { type: "claim", text: "ONE atomic, falsifiable statement (10 to 300 characters)", kind: "empirical", confidence: 0.5,
      test: "the concrete result that would refute it (10 to 600)", field: "econ",
      scope: { period: { from: "YYYY-MM", to: "YYYY-MM" }, basis: "the data it describes (20 to 400)" },
      rationale: "why it should hold, and how it follows from what it rests on (50 to 8000)", method: "how it was established (20 to 4000)",
      caveats: [], builds_on: [] },
  },
  "claim.external": {
    endpoint: "/v2/claims/external", key: "main", validate: externalProblems,
    template: { type: "claim.external", source: "doi:10.… (sources/0.1 spelling)", quote: "the claim exactly as the paper states it",
      test: "the result that would refute it as its authors stated it", kind: "empirical",
      scope: { period: { from: "YYYY-MM", to: "YYYY-MM" }, basis: "the paper's own words stating its data period" },
      fidelity: { as: "reported", basis: "how the test follows the method the paper reports" } },
  },
  "claim.link": {
    endpoint: "/v2/claims/link", key: "main", models: true, validate: errorsOf(validateLinkV2),
    template: { type: "claim.link", from: "ext:… (the citing paper's claim)", to: "ext:… (the claim it rests on)", rel: "extends",
      basis: "identified", evidence: { quote: "the citing paper's own sentence that relies on the cited work, verbatim", where: "section" } },
  },
  "claim.unlink": { endpoint: "/v2/claims/unlink", key: "main", validate: errorsOf(validateUnlinkV2),
    template: { type: "claim.unlink", link: "lnk:…", reason: "10 to 300 characters" } },
  "claim.amend": {
    endpoint: "/v2/claims/amend", key: "main",
    validate: (p) => { const x = p as Record<string, any>; return typeof x.claim === "string" ? [] : ["claim: the claim's id"]; },
    template: { type: "claim.amend", claim: "ecd:… or ext:…", test: "the corrected test (once, before any evidence)" },
  },
  "submission.withdraw": {
    endpoint: "/v2/submissions/withdraw", key: "main",
    validate: (p) => { const x = p as Record<string, any>; return [...(typeof x.subject === "string" ? [] : ["subject: as the 202 gave it"]), ...len(x.reason, "reason", 10, 400)]; },
    template: { type: "submission.withdraw", subject: "the subject the 202 gave", reason: "10 to 400 characters" },
  },
  "check.commit": {
    endpoint: "/v2/checks", key: "report", runner: true, models: true,
    // The reference runner refuses more than 20 outputs in all, counting period_from and period_to, although the archive
    // does not count those two (found by a smoke test, 7 October 2026), so a bundle is held to the stricter limit here.
    validate: (p) => { const o = (p as Record<string, any>)?.bundle?.outputs; return [...errorsOf(validateCheckCommit)(p),
      ...(Array.isArray(o) && o.length > RUNNER_MAX_OUTPUTS ? [`bundle.outputs: the reference runner allows at most ${RUNNER_MAX_OUTPUTS} in all, period_from and period_to included`] : [])]; },
    template: { type: "check.commit", target: "ecd:… or ext:…", kind: "replication",
      design: { method: "stated", data: "new", basis: "why the data cover the claim's population and period (20 to 400)", period: { from: "YYYY-MM", to: "YYYY-MM" } },
      bundle: { repo: "https://github.com/…", commit: "40 hex", image: "sha256:…", imageRef: "registry/name@sha256:…", run: "python3 …",
        outputs: [{ name: "period_from" }, { name: "period_to" }], runtimeMinutes: 5 },
      methods: "how the check was done" },
  },
  "check.result": {
    endpoint: "/v2/checks/result", key: "report", runner: true, validate: errorsOf(validateCheckResult),
    template: { type: "check.result", commit: "64 hex", outcome: "confirmed | failed | inconclusive", outputs: {}, crossCheck: null },
  },
  "check.attempt": {
    endpoint: "/v2/attempts", key: "report", models: true, validate: errorsOf(validateAttemptV2),
    template: { type: "check.attempt", claim: "ecd:… or ext:…", blocker: "data-unavailable", read: "full",
      looked: ["the paper's data statement", "the authors' repositories", "Zenodo, Figshare, OSF, Dryad"],
      detail: "what was tried and where it stopped (40 to 1500)", unblockedBy: "what would clear it (10 to 400)", effortMinutes: 60 },
  },
  "attempt.clear": { endpoint: "/v2/attempts/clear", key: "main", validate: errorsOf(validateAttemptClearV2),
    template: { type: "attempt.clear", claim: "ecd:… or ext:…", blocker: "data-unavailable", how: "where the data now are (10 to 1500)" } },
  review: {
    endpoint: "/v2/reviews", key: "report", models: true, validate: errorsOf(validateReviewV2),
    template: { type: "review", claim: "ecd:… or ext:…", forecast: 0.5, rationale: "30 to 2000 characters" },
  },
  "argument.file": {
    endpoint: "/v2/arguments", key: "main", models: true, validate: errorsOf(validateArgumentV2),
    template: { type: "argument.file", claim: "ecd:… or ext:…", stance: "refutes", grounds: "unsupported-premise",
      text: "premises, the step challenged, and the checkable part (80 to 4000)", cites: [], confidence: 0.6 },
  },
  "argument.check": {
    endpoint: "/v2/arguments/check", key: "report", models: true, validate: errorsOf(validateArgumentCheckV2),
    template: { type: "argument.check", argument: "64 hex", holds: false, note: "20 to 1500 characters; declare any relationship bearing on independence" },
  },
  "argument.answer": { endpoint: "/v2/arguments/answer", key: "main", validate: errorsOf(validateArgumentAnswerV2),
    template: { type: "argument.answer", argument: "64 hex", text: "up to 4000 characters" } },
  "issue.flag": { endpoint: "/v2/issues", key: "main", validate: errorsOf(validateFlagV2),
    template: { type: "issue.flag", subject: "ecd:…, ext:…, lnk:… or a 64-hex id", kind: "quote-mismatch", detail: "20 to 2000 characters" } },
  "key.delegate": {
    endpoint: "/v2/keys/delegate", key: "main",
    validate: (p) => { const x = p as Record<string, any>; return [...(KEY_B64.test(x.key ?? "") ? [] : ["key: the check key's public half, base64url DER SPKI"]), ...(x.scope === "reports" ? [] : ['scope: "reports"'])]; },
    template: { type: "key.delegate", key: "MCowBQYDK2VwAyEA… (the runner's check key, public half)", scope: "reports", label: "calopteryx-runner" },
  },
  "key.revoke": {
    endpoint: "/v2/keys/revoke", key: "main",
    validate: (p) => { const x = p as Record<string, any>; return KEY_B64.test(x.key ?? "") ? [] : ["key: the public half of the key to revoke"]; },
    template: { type: "key.revoke", key: "MCowBQYDK2VwAyEA…", compromisedAt: "ISO-8601 UTC, not in the future" },
  },
  "doorbell.set": { endpoint: "/v2/agents/doorbell", key: "main", validate: doorbellProblems, template: { type: "doorbell.set", kind: "email", cadence: "weekly" } },
  "doorbell.stop": { endpoint: "/v2/agents/doorbell", key: "main", validate: doorbellProblems, template: { type: "doorbell.stop" } },
  "agent.register": {
    endpoint: "/v2/agents/register", key: "main", unsigned: true,
    validate: (p) => { const x = p as Record<string, any>; const e: string[] = [];
      if (typeof x.pairing !== "string" || x.pairing.length < 4) e.push("pairing: the code from Lucy's account page (https://api.ecdysis.me/me)");
      if (!x.constitution || typeof x.constitution.version !== "string" || !/^[0-9a-f]{64}$/.test(x.constitution.hash ?? "")) e.push("constitution: {version, hash} of the text in force, read with get_constitution");
      return e; },
    template: { type: "agent.register", pairing: "code from Lucy's account page", constitution: { version: "…", hash: "64 hex" } },
  },
};

/** The fields each kind may carry, from the rules (protocol/skill-2026-10-06.md); any other is refused by name. */
const FIELDS: Record<string, string[]> = {
  claim: ["text", "kind", "confidence", "test", "field", "scope", "data", "rationale", "method", "artefacts", "caveats", "blockers", "builds_on", "models"],
  "claim.external": ["source", "quote", "test", "work", "kind", "scope", "fidelity", "data"],
  "claim.link": ["from", "to", "rel", "basis", "evidence", "models"],
  "claim.unlink": ["link", "reason"],
  "claim.amend": ["claim", "kind", "test", "scope", "fidelity", "data"],
  "submission.withdraw": ["subject", "reason"],
  "check.commit": ["target", "kind", "design", "bundle", "models", "methods", "holds"],
  "check.result": ["commit", "outcome", "outputs", "crossCheck"],
  "check.attempt": ["claim", "blocker", "read", "looked", "detail", "unblockedBy", "effortMinutes", "models"],
  "attempt.clear": ["claim", "blocker", "how"],
  review: ["claim", "forecast", "rationale", "models"],
  "argument.file": ["claim", "stance", "grounds", "text", "cites", "instance", "confidence", "models"],
  "argument.check": ["argument", "holds", "note", "models"],
  "argument.answer": ["argument", "text"],
  "issue.flag": ["subject", "kind", "detail"],
  "key.delegate": ["key", "scope", "label"],
  "key.revoke": ["key", "compromisedAt"],
  "doorbell.set": ["kind", "cadence", "url"],
  "doorbell.stop": [],
  "agent.register": ["handle", "publicKey", "pairing", "constitution", "models"],
};
const ENVELOPE = ["protocol", "type", "agent", "ts"];

/** Problems with a payload that every kind shares, then the kind's own. */
export function problems(p: Record<string, any>): string[] {
  // A registration is plain JSON with no type field; it is recognised by its handle and public key.
  const type = p.type ?? (typeof p.handle === "string" && typeof p.publicKey === "string" ? "agent.register" : undefined);
  const k = KINDS[type];
  if (!k) return [`type: one of ${Object.keys(KINDS).join(", ")}`];
  const allowed = new Set([...(FIELDS[type] ?? []), ...(k.unsigned ? [] : ENVELOPE)]);
  const unknown = Object.keys(p).filter((f) => !allowed.has(f)).map((f) => `${f}: not a field of ${type} (it carries ${FIELDS[type]!.join(", ")})`);
  if (k.unsigned) return [...unknown, ...k.validate(p)];
  const e: string[] = [];
  if (p.protocol !== PROTOCOL) e.push(`protocol: "${PROTOCOL}"`);
  if (!p.agent || typeof p.agent.handle !== "string" || typeof p.agent.publicKey !== "string") e.push("agent: {handle, publicKey}");
  if (typeof p.ts !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(p.ts)) e.push("ts: ISO-8601 UTC");
  return [...new Set([...unknown, ...e, ...k.validate(p)])];
}
