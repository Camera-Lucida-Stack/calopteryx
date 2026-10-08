// Tests of the Calopteryx tool. Nothing here uses the network or costs money: rehearsals run on a saved copy of the public
// log (test/fixtures), reviews use the stand-in reviewer, and nothing is ever filed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync, statSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { problems } from "../src/calopteryx/kinds.js";
import { privateDetails, withholdPrivateLinks } from "../src/calopteryx/privacy.js";
import { disclosureProblem, type Relationship } from "../src/calopteryx/relationships.js";
import { skeleton, signoffProblem } from "../src/calopteryx/signoff.js";
import { review, standIn, GENERAL, type Review } from "../src/calopteryx/review.js";
import { fetchLiveLog, privateCopy, signer, rehearseOne, offline, LOG_FIXTURE_ENV, rehearsalRefusal, CROSS_CHECK_UNREHEARSABLE, type LiveEntry } from "../src/calopteryx/rehearse.js";
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

test("a receipt's outputs are held to the reference runner's limit of 20, period_from and period_to included", () => {
  const outputs = (n: number) => [{ name: "period_from" }, { name: "period_to" }, ...Array.from({ length: n }, (_, i) => ({ name: `x${i}`, tolerance: 1e-9 }))];
  const commit = (n: number) => ({ ...base, type: "check.commit", target: HIS_CLAIM, kind: "replication",
    design: { method: "stated", data: "original", basis: "b".repeat(30), period: { from: "2017-10", to: "2019-05" } },
    bundle: { repo: "https://github.com/Camera-Lucida-Stack/calopteryx", commit: "a".repeat(40), run: "python3 run.py", outputs: outputs(n), runtimeMinutes: 5 } });
  assert.doesNotMatch(problems(commit(18)).join(), /reference runner/);
  assert.match(problems(commit(20)).join(), /reference runner allows at most 20/);   // the archive alone would accept 22
});

test("private details are blocked, research text and the required disclosure are allowed", () => {
  const terms = ["Lucy", "0009-0006-4279-7152"];
  for (const t of ["mail someone@example.org", "call 020 7946 0958.", "phone +44 7700 900123.", "12 Acacia Avenue", "LS1 4AP", "0000-0002-1825-0097", "Lucy said", "SSN 123-45-6789", "QQ 12 34 56 C"])
    assert.ok(privateDetails({ type: "review", rationale: t }, terms).length, t);
  for (const t of ["Calopteryx's operator works with Dr Daniel Hulme.", "63,302,563 bytes; doi:10.1186/gb-2013-14-10-r115; 2009-04 to 2012-07; p = 0.031", "version 2.1.0; 1.06 and 1.20; lucid"])
    assert.deepEqual(privateDetails({ type: "review", rationale: t }, terms), [], t);
});

test("private links and shown-once secrets are withheld from the records; ordinary links are kept", () => {
  // A doorbell reply as the tool saves it: the body is the reply's text, so its quotes are escaped.
  const body = JSON.stringify({ status: "pending", for_your_person: "https://ecdysis.me/doorbell/994ad8f4e3e20b19/1d28d49ab19b8aeb", signing_secret: "whsec_c2VjcmV0K2J5dGVzLz0=" });
  const saved = JSON.stringify({ status: 202, body }, null, 2);
  const r = withholdPrivateLinks(saved);
  assert.equal(r.withheld, 2);
  assert.ok(!r.text.includes("994ad8f4") && !r.text.includes("whsec_"), r.text);
  assert.equal(JSON.parse(JSON.parse(r.text).body).for_your_person, "[private link withheld from the public repository]");
  for (const t of ["https://ecdysis.me/skill.md#doorbells", "doorbell.set, kind email, cadence weekly", "https://api.ecdysis.me/v2/agents/doorbell"])
    assert.deepEqual(withholdPrivateLinks(t), { text: t, withheld: 0 }, t);
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
  assert.match(cx(["keygen", "--check"]).out, /never beside the main key/);
  const runner = mkdtempSync(join(tmpdir(), "runner-"));
  symlinkSync(join(ROOT, "node_modules"), join(runner, "node_modules"));
  const rx = (args: string[]) => { const r = spawnSync("node", ["--import", "tsx", join(ROOT, "src/calopteryx/cli.ts"), ...args], { cwd: runner, env, encoding: "utf8" }); return `${r.stdout}${r.stderr}`; };
  assert.match(rx(["keygen", "--check"]), /Check key generated/);
  assert.match(rx(["keygen", "--check"]), /never overwritten/);
  assert.match(rx(["keygen"]), /main key is never generated where other agents' code runs/);
  assert.match(rx(["role"]), /^runner machine/);
  rx(["new", "c2", "claim"]);
  assert.match(rx(["approve", "c2"]), /needs the main key, which is never on the runner machine/);
  const inRepo = spawnSync("node", ["--import", "tsx", join(ROOT, "src/calopteryx/cli.ts"), "keygen", "--check"], { cwd: ROOT, env, encoding: "utf8" });
  assert.match(`${inRepo.stdout}${inRepo.stderr}`, /never beside the main key or in Calopteryx's own repository/);
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

test("a cross-checked result's unrehearsable comparison passes only with Lucy's reasons; every other refusal blocks", () => {
  const result = { ...base, type: "check.result", commit: "a".repeat(64), outputs: { x: 1 }, crossCheck: { receipt: "b".repeat(64), outputs: { x: 1 } } };
  const missing = { accepted: false, status: 500, body: { error: CROSS_CHECK_UNREHEARSABLE } };
  const reasons = "Approved by Lucy: only the live archive holds the earlier receipt's outputs.";
  // This exact failure: refused without the override, with an empty one, or with another option in its place; passes with reasons.
  assert.match(rehearsalRefusal(result, missing)!, /--rehearsal-override/);
  assert.match(rehearsalRefusal(result, missing, " ")!, /--rehearsal-override/);
  assert.match(rehearsalRefusal(result, missing, "--confirm")!, /--rehearsal-override/);
  assert.equal(rehearsalRefusal(result, missing, reasons), null);
  // Any other 500, or the same words at another status, in another kind of item, or without a cross-check: refused even with the override.
  for (const [p, r] of [
    [result, { accepted: false, status: 500, body: { error: "internal error" } }],
    [result, { accepted: false, status: 500, body: { error: CROSS_CHECK_UNREHEARSABLE + "." } }],
    [result, { accepted: false, status: 500, body: null }],
    [result, { accepted: false, status: 422, body: { error: CROSS_CHECK_UNREHEARSABLE } }],
    [{ ...result, type: "check.commit" }, missing],
    [{ ...result, crossCheck: undefined }, missing],
  ] as const) {
    const why = rehearsalRefusal(p, r, reasons);
    assert.ok(why && /the copy refused it/.test(why) && !/--rehearsal-override/.test(why), JSON.stringify(r));
  }
  assert.equal(rehearsalRefusal(result, { accepted: true, status: 201, body: {} }), null);

  // The summary says the comparison could not be rehearsed, and where a result's disclosure is carried.
  const rel: Relationship = { operator: "op_x", agents: ["Imago"], touches: ["the receipt cross-checked is by Imago"], changes: [] };
  const text = skeleton("res", result, "f".repeat(64), [], rel, true);
  assert.match(text, /could not make the cross-check comparison/);
  assert.match(text, /Only the live archive can compare the outputs/);
  assert.match(text, /disclosure is carried by the commitment's methods/);
  assert.doesNotMatch(text, /changed nothing of theirs/);
  assert.doesNotMatch(skeleton("res", result, "f".repeat(64), [], rel, false), /could not make the cross-check comparison/);
  assert.match(skeleton("rv", { ...base, type: "review" }, "f".repeat(64), [], rel), /Its text discloses the relationship/);
});
