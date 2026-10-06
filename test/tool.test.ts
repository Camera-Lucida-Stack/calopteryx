// Tests of the Calopteryx tool. Nothing here uses the network or costs money: rehearsals run on a saved copy of the public
// log (test/fixtures), reviews use the stand-in reviewer, and nothing is ever filed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync, statSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { problems } from "../src/calopteryx/kinds.js";
import { privateDetails } from "../src/calopteryx/privacy.js";
import { disclosureProblem, type Relationship } from "../src/calopteryx/relationships.js";
import { skeleton, signoffProblem } from "../src/calopteryx/signoff.js";
import { review, standIn, GENERAL, type Review } from "../src/calopteryx/review.js";
import { fetchLiveLog, privateCopy, signer, rehearseOne, offline, LOG_FIXTURE_ENV, type LiveEntry } from "../src/calopteryx/rehearse.js";
import { assess } from "../src/calopteryx/relationships.js";
import { generateKeyPair } from "../src/calopteryx/platform.js";

const ROOT = resolve(import.meta.dirname, "..");
const FIXTURE = join(ROOT, "test/fixtures/live-log-2026-10-06.json");
const HIS_CLAIM = "ext:ffe216bb01e10209";          // registered by Exuvia, one of Dr Hulme's agents, with no receipts
const agent = { handle: "Calopteryx", publicKey: "MCowBQYDK2VwAyEA" + "A".repeat(43) };
const base = { protocol: "ecdysis/0.2", agent, ts: "2026-10-06T12:00:00Z" };
const noKey = () => { throw new Error("no real key in tests"); };

test("the platform's rules accept good items and refuse typical faults", () => {
  const review = { ...base, type: "review", claim: HIS_CLAIM, forecast: 0.7, rationale: "The design is sound and the sample covers the stated period." };
  assert.deepEqual(problems(review), []);
  assert.match(problems({ ...review, rationale: "short" }).join(), /rationale/);
  assert.match(problems({ ...review, rationalle: "x" }).join(), /rationalle/);
  assert.match(problems({ ...base, type: "claim.external", source: "https://doi.org/10.1/x", quote: "q".repeat(20), test: "t".repeat(20), scope: { general: "construction", basis: "b".repeat(30) }, fidelity: { as: "reported", basis: "b".repeat(30) } }).join(), /source/);
  assert.match(problems({ ...base, type: "doorbell.set", kind: "email", cadence: "daily" }).join(), /weekly/);
  const reg = { handle: "Calopteryx", publicKey: agent.publicKey, pairing: "ABCD-1234", constitution: { version: "2.1.0", hash: "9ecee1583707c107e9d8af208aa37e50966885ad50fb179d950f6e8cb6f1276a" }, models: ["claude-opus-5-5"] };
  assert.deepEqual(problems(reg), []);
  assert.match(problems({ ...reg, operatorId: "mine" }).join(), /operatorId/);
});

test("private details are blocked, research text and the required disclosure are allowed", () => {
  const terms = ["Lucy", "0009-0006-4279-7152"];
  for (const t of ["mail someone@example.org", "call 020 7946 0958.", "phone +44 7700 900123.", "12 Acacia Avenue", "LS1 4AP", "0000-0002-1825-0097", "Lucy said", "SSN 123-45-6789", "QQ 12 34 56 C"])
    assert.ok(privateDetails({ type: "review", rationale: t }, terms).length, t);
  for (const t of ["Calopteryx's operator works with Dr Daniel Hulme.", "63,302,563 bytes; doi:10.1186/gb-2013-14-10-r115; 2009-04 to 2012-07; p = 0.031", "version 2.1.0; 1.06 and 1.20; lucid"])
    assert.deepEqual(privateDetails({ type: "review", rationale: t }, terms), [], t);
});

test("an item touching Dr Hulme's agents' work must disclose the relationship in its own text", () => {
  const rel: Relationship = { operator: "op", agents: ["Exuvia"], touches: ["the claim is by Exuvia"], changes: [] };
  assert.ok(disclosureProblem({ type: "review", rationale: "Sound." }, rel));
  assert.equal(disclosureProblem({ type: "review", rationale: "Sound. The operator works with Dr Hulme." }, rel), null);
  assert.equal(disclosureProblem({ type: "check.result" }, rel), null);
  assert.equal(disclosureProblem({ type: "review", rationale: "Sound." }, { ...rel, touches: [] }), null);
});

test("the sign-off summary must answer every blocking and major point in its own section", () => {
  const reviews = [{ reviewer: GENERAL, issues: [
    { severity: "blocking", nature: "clear error", location: "a", problem: "P1", fix: "F1" },
    { severity: "major", nature: "judgement call", location: "b", problem: "P2", fix: "F2" },
    { severity: "minor", nature: "clear error", location: "c", problem: "P3", fix: "F3" }] }] as unknown as Review[];
  const dir = mkdtempSync(join(tmpdir(), "signoff-")), h = "a".repeat(64);
  const sk = skeleton("t", { type: "review", claim: "ext:x" }, h, reviews, null);
  const filled = sk.replace(/<!-- WRITE[^>]*-->/g, "Written.");
  const check = (text: string, hash = h) => { writeFileSync(join(dir, "SIGNOFF.md"), text); return signoffProblem(dir, hash, reviews); };
  assert.match(check(sk)!, /still to be written/);
  assert.equal(check(filled), null);
  assert.match(check(filled.replace(/(### \[G1\][\s\S]*?\*\*Response:\*\*) Written\./, "$1"))!, /G1/);
  assert.match(check(filled, "b".repeat(64))!, /different version/);
});

test("the stand-in reviewer costs nothing and logs nothing; a malformed reply is refused", async () => {
  const log = join(ROOT, "records/costs/reviews.csv");
  const before = existsSync(log) ? readFileSync(log, "utf8") : "";
  const r = await review(GENERAL, { type: "review" }, "", [], { label: "test", call: standIn() });
  assert.equal(r.cost, 0);
  assert.equal(existsSync(log) ? readFileSync(log, "utf8") : "", before);
  const bad = async () => ({ text: JSON.stringify({ issues: [{ severity: "fatal" }] }), cost: 0, generation: null, prompt: 0, completion: 0 });
  await assert.rejects(review(GENERAL, {}, "", [], { label: "test", call: bad }), /unknown severity/);
});

test("the private copy is exact, a tampered log is refused, and a rehearsal cannot reach the network", async () => {
  const entries = (JSON.parse(readFileSync(FIXTURE, "utf8")) as { entries: LiveEntry[] }).entries;
  const copy = await privateCopy(entries);
  assert.equal(copy.size, entries.length);
  const altered = structuredClone(entries); (altered[5]!.payload as any).handle = "Someone-else";
  await assert.rejects(privateCopy(altered), /differs from the live log at entry 5/);
  process.env[LOG_FIXTURE_ENV] = FIXTURE;
  try { assert.equal((await fetchLiveLog()).length, entries.length); } finally { delete process.env[LOG_FIXTURE_ENV]; }
  await assert.rejects(offline(() => fetch("https://api.ecdysis.me/v2/log/sth")), /network refused/);
});

test("the rehearsal shows when a result would be deciding on Dr Hulme's agents' work, only once Calopteryx is verified", async () => {
  const entries = (JSON.parse(readFileSync(FIXTURE, "utf8")) as { entries: LiveEntry[] }).entries;
  for (const [tier, expected] of [["account", 0], ["verified", 1]] as const) {
    const c = await privateCopy(entries);
    const k = await signer(c, "Calopteryx", ["claude-opus-5-5"], tier, noKey);
    const commit = { ...base, type: "check.commit", target: HIS_CLAIM, kind: "replication",
      design: { method: "stated", data: "new", basis: "New data covering the claim's whole population, for this test only." },
      bundle: { repo: "https://github.com/example/b", commit: "c".repeat(40), run: "python3 r.py", outputs: [{ name: "r", tolerance: 0.01 }], runtimeMinutes: 5 } };
    const cm = await rehearseOne(c, "/v2/checks", commit, k);
    assert.ok(cm.accepted, JSON.stringify(cm.body));
    const result = { ...base, type: "check.result", commit: (cm.body as any).id, outcome: "confirmed", outputs: { r: 0.9 }, crossCheck: null };
    const { relationship } = await assess(c, result, () => rehearseOne(c, "/v2/checks/result", result, k));
    assert.deepEqual(relationship.agents, ["Exuvia", "Imago"]);
    assert.ok(relationship.touches.length);
    assert.equal(relationship.changes.length, expected, `${tier}: ${relationship.changes.join("; ")}`);
  }
});

// The whole path, from a blank draft to a signed approval, through the command line, in a throwaway folder.
test("end to end: every gate refuses in turn, then the approval is signed and recorded", async () => {
  const dir = mkdtempSync(join(tmpdir(), "calopteryx-"));
  cpSync(join(ROOT, "reviewers"), join(dir, "reviewers"), { recursive: true });
  cpSync(join(ROOT, "config.example.json"), join(dir, "config.example.json"));
  symlinkSync(join(ROOT, "node_modules"), join(dir, "node_modules"));
  const env = { ...process.env, [LOG_FIXTURE_ENV]: FIXTURE, CALOPTERYX_REVIEWER: "standin", CALOPTERYX_CHECK_KEY: "" };
  const cx = (args: string[], e: NodeJS.ProcessEnv = env) => {
    const r = spawnSync("node", ["--import", "tsx", join(ROOT, "src/calopteryx/cli.ts"), ...args], { cwd: dir, env: e, encoding: "utf8" });
    return { code: r.status, out: `${r.stdout}${r.stderr}` };
  };
  const draft = join(dir, "outbox/r1/draft.json");
  const edit = (f: (d: any) => void) => { const d = JSON.parse(readFileSync(draft, "utf8")); f(d); writeFileSync(draft, JSON.stringify(d, null, 2)); };
  const fillSummary = () => { const f = join(dir, "outbox/r1/SIGNOFF.md"); writeFileSync(f, readFileSync(f, "utf8").replace(/<!-- WRITE[^>]*-->/g, "Written for the test.")); };

  assert.match(cx(["role"]).out, /No Calopteryx key/);
  const kg = cx(["keygen"]);
  assert.match(kg.out, /Public key: MCowBQYDK2VwAyEA/);
  const key = JSON.parse(readFileSync(join(dir, "keys/main.key.json"), "utf8"));
  assert.ok(!kg.out.includes(key.privateKey), "the private key must never be printed");
  assert.equal(statSync(join(dir, "keys/main.key.json")).mode & 0o777, 0o600);
  assert.match(cx(["keygen"]).out, /never overwritten/);
  assert.match(cx(["role"]).out, /^main machine/);

  cx(["new", "r1", "review"]);
  edit((d) => { d.claim = HIS_CLAIM; d.forecast = 0.6; d.rationale = "The method is clearly stated and the data cover the claim's population."; });
  assert.match(cx(["approve", "r1"]).out, /rehearse it first/);
  const reh = cx(["rehearse", "r1"]);
  assert.match(reh.out, /SAVED log/);
  assert.match(reh.out, /✓ r1 \(review\): 201/);
  assert.match(reh.out, /Exuvia, Imago/);
  assert.match(cx(["approve", "r1"]).out, /review it first/);
  assert.equal(cx(["review", "r1"]).code, 0);
  assert.match(cx(["review", "r1"]).out, /has had its review/);
  assert.match(cx(["approve", "r1"]).out, /no sign-off summary/);
  cx(["summary", "r1"]);
  assert.match(cx(["approve", "r1"]).out, /still to be written/);
  fillSummary();
  assert.match(cx(["approve", "r1"]).out, /must disclose the operator's relationship with Dr Hulme/);

  // Adding the disclosure changes the item, so every earlier gate must be passed again.
  edit((d) => { d.rationale += " Calopteryx's operator works with Dr Daniel Hulme, whose agent registered this claim."; });
  assert.match(cx(["approve", "r1"]).out, /changed since its rehearsal/);
  cx(["rehearse", "r1"]);
  assert.match(cx(["approve", "r1"]).out, /changed since its review/);
  cx(["review", "r1", "--round-reason", "disclosure added"]);
  cx(["summary", "r1", "--replace"]); fillSummary();

  // Test stand-ins cannot support a real approval.
  assert.match(cx(["approve", "r1"], { ...env, [LOG_FIXTURE_ENV]: "" }).out, /saved log, which cannot support an approval/);
  assert.match(cx(["approve", "r1"], { ...env, CALOPTERYX_REVIEWER: "" }).out, /stand-in reviewer, used only in tests/);

  const shown = cx(["approve", "r1"]);
  const prefix = shown.out.match(/--confirm ([0-9a-f]{12})/)![1]!;
  assert.match(shown.out, /Read the sign-off summary first/);
  assert.match(cx(["approve", "r1", "--confirm", "0".repeat(12)]).out, /To approve exactly this/);
  const ok = cx(["approve", "r1", "--confirm", prefix]);
  assert.match(ok.out, /✓ approved and signed/);
  const approval = JSON.parse(readFileSync(join(dir, "outbox/r1/approval.json"), "utf8"));
  assert.match(approval.summarySha256, /^[0-9a-f]{64}$/);
  assert.ok(existsSync(join(dir, "records/calopteryx/r1/signed.json")));
  assert.match(cx(["file", "r1"]).out, /add --live/);

  // A private detail is caught by check, and blocks approval.
  cx(["new", "r2", "review"]);
  writeFileSync(join(dir, "outbox/r2/draft.json"), JSON.stringify({ type: "review", claim: HIS_CLAIM, forecast: 0.5,
    rationale: "Write to me at someone@example.org about the method. Calopteryx's operator works with Dr Daniel Hulme." }));
  const chk = cx(["check", "r2"]);
  assert.equal(chk.code, 1);
  assert.match(chk.out, /an email address/);
  cx(["rehearse", "r2"]); cx(["review", "r2"]); cx(["summary", "r2"]);
  const f2 = join(dir, "outbox/r2/SIGNOFF.md"); writeFileSync(f2, readFileSync(f2, "utf8").replace(/<!-- WRITE[^>]*-->/g, "Written."));
  assert.match(cx(["approve", "r2"]).out, /no private details: reword to remove: rationale: an email address/);

  // The two-machine rule.
  const check = await generateKeyPair();
  assert.match(cx(["role"], { ...env, CALOPTERYX_CHECK_KEY: JSON.stringify(check) }).out, /both the main key and the check key/);
  cx(["new", "c1", "check.commit"]);
  assert.match(cx(["approve", "c1"]).out, /receipt work, done on the runner machine/);
});

test("filed items touching Dr Hulme's agents' work are listed for audit; others are not", async () => {
  const dir = mkdtempSync(join(tmpdir(), "audit-")), here = process.cwd();
  const { auditRelationship } = await import("../src/calopteryx/cli.js");
  process.chdir(dir);
  try {
    const rel = { operator: "op", agents: ["Exuvia", "Imago"], touches: ["the claim ext:x is by Exuvia"], changes: ["the claim ext:x would move from unchecked to supported"] };
    for (const [n, r] of [["a", rel], ["b", { ...rel, touches: [] }]] as const) {
      const d = join("outbox", n); spawnSync("mkdir", ["-p", d]);
      writeFileSync(join(d, "rehearsal.json"), JSON.stringify({ relationship: r }));
      auditRelationship(n, { type: "review" }, 201);
    }
    const lines = readFileSync("records/relationships.csv", "utf8").trim().split("\n");
    assert.equal(lines.length, 2);
    assert.match(lines[1]!, /"a","review","201","Exuvia Imago"/);
    assert.match(lines[1]!, /would move from unchecked to supported/);
  } finally { process.chdir(here); }
});
