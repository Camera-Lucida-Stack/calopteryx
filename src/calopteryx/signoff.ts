// The sign-off summary (PLAYBOOK.md, "Sign-off"): a plain-English page for Lucy covering what is being filed and what it
// says; what could be wrong with it, with every blocking and major point from the reviews and the response to each; what
// was already known; and what happens once it is filed. She never needs to open a data file to decide.
// The tool writes what can be written mechanically; the parts marked WRITE are written by Claude in the session, and
// approval is refused while any remains, or while any blocking or major point from the latest review lacks a response.
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { Review } from "./review.js";

export const WRITE = "<!-- WRITE";
export const SIGNOFF = "SIGNOFF.md";

/** What happens once each kind of item is filed, from the rules (protocol/skill-2026-10-06.md). */
const AFTERWARDS: Record<string, string> = {
  claim: "It is published on the public record at once if screening passes, permanently; it cannot be edited, only corrected once (its kind, test or scope) before any evidence lands on it. Its credence starts at the stated confidence, shrunk towards a half by your calibration record, and from then on moves only with independent evidence. When it resolves, the confidence is scored against your record.",
  "claim.external": "The paper's claim goes on the public record permanently under an id made from its source and quote, at a neutral prior. Ecdysis's quote scout checks the quote against the source's published text and shows what it found. Others may then test it; the test written here is shown as Calopteryx's.",
  "claim.link": "The link is shown on both claims' pages with the citing sentence, and adds to the reliance (and so the stakes) of the claim relied on. It moves no credence. It can be withdrawn later, but stays on the log, marked withdrawn.",
  "check.commit": "Ecdysis seals the commitment and returns the seed, and usually an earlier receipt of the same claim to cross-check. The result must be filed within seven days, whatever it shows; missing the deadline is a lapse on your record. Nothing in the bundle can be changed after this.",
  "check.result": "The outcome is filed against the claim's test and, for a replication test, moves the claim's credence. Our outputs stay hidden until someone cross-checks them or thirty days pass. The report is scored when the claim resolves.",
  "check.attempt": "The attempt goes on the public record, saying what stopped the check and what would clear it. It moves no credence and costs nothing; if the blocker is on the authors' side and well supported, it adds pressure on them to release what is missing.",
  review: "The review is published with its forecast, moves the claim's credence a little, and is scored against your record when the claim resolves.",
  "argument.file": "The argument is published and stays open until independent checkers on two model families settle it. If they dismiss it, it counts against your record and in the claim's favour; if they uphold it, it moves the claim.",
  "argument.check": "The check is published and counts towards settling the argument. It is scored against the settlement reached without our operator.",
  "argument.answer": "The answer is shown beside the argument for checkers to read. It weighs nothing by itself, and only one answer is allowed.",
  "issue.flag": "The flag goes privately to the stewards, off the public log. Nothing changes until a steward acts.",
  "key.delegate": "The check key is authorised to sign reports (receipts, reviews, attempts and argument checks) for Calopteryx, and nothing else. It can be revoked with the main key.",
  "key.revoke": "Every report the key signed from the stated time is disowned and feeds no number. This cannot be undone.",
  "doorbell.set": "Ecdysis returns a private link for you, where you enter the address for the alerts and confirm it from your inbox. Nothing is sent until you do.",
  "doorbell.stop": "The alerts stop.",
  "agent.register": "Calopteryx is registered permanently under your account, accepting the constitution in force; its handle cannot be reused. Its public key and declared models go on the public log.",
  "claim.amend": "The one correction allowed is made; both versions are shown on the claim's page. No further correction is possible.",
  "claim.unlink": "The link is marked withdrawn, permanently.",
  "attempt.clear": "The blocker is recorded as cleared, with the explanation given, and others can act on it.",
  "submission.withdraw": "The held item is never published. To publish the work later, it must be signed and submitted again.",
};

const SKIP = new Set(["protocol", "agent", "ts", "type"]);
function readable(v: unknown, indent = ""): string {
  if (v === null || v === undefined) return "none";
  if (Array.isArray(v)) return v.length ? v.map((x) => `\n${indent}- ${readable(x, indent + "  ")}`).join("") : "none";
  if (typeof v === "object" && Object.values(v as object).every((x) => x === null || typeof x !== "object"))
    return Object.entries(v as Record<string, unknown>).map(([k, x]) => `${k}: ${x}`).join("; ");
  if (typeof v === "object") return Object.entries(v as Record<string, unknown>).map(([k, x]) => `\n${indent}- ${k}: ${readable(x, indent + "  ")}`).join("");
  return String(v);
}

/** A stable tag for each review point, so the summary's responses can be matched to the review. */
export const tagOf = (r: Review, i: number) => `${r.reviewer.role === "general" ? "G" : "S"}${i + 1}`;
const weighty = (reviews: Review[]) => reviews.flatMap((r) => r.issues.map((x, i) => ({ r, x, tag: tagOf(r, i) }))).filter(({ x }) => x.severity !== "minor");

export function skeleton(name: string, p: Record<string, any>, hash: string, reviews: Review[]): string {
  const type = p.type ?? "agent.register";
  const fields = Object.entries(p).filter(([k]) => !SKIP.has(k)).map(([k, v]) => `- **${k}**: ${readable(v, "  ")}`).join("\n");
  const points = weighty(reviews).map(({ r, x, tag }) =>
    `### [${tag}] ${x.severity.toUpperCase()} (${x.nature}), from ${r.reviewer.name}\n\n${x.problem}\n\nThe reviewer suggests: ${x.fix}\n\n**Response:** ${WRITE}: what was done about this, or why it is accepted as it stands -->\n`).join("\n");
  const minors = reviews.flatMap((r) => r.issues.map((x, i) => ({ r, x, tag: tagOf(r, i) }))).filter(({ x }) => x.severity === "minor");
  return `# Sign-off: ${name}

Item fingerprint: ${hash}
(The approval command shows the start of this fingerprint; approve only if they match.)

## 1. What is being filed, and what it says

${WRITE}: in plain English, what this is and what it claims or does, and why it is worth filing -->

The exact content, as it will be signed (${type}):

${fields}

## 2. What could be wrong with it

${WRITE}: a short overall judgement of the reviews -->

${points || "Neither review raised a blocking or major point."}
${minors.length ? `\nMinor points, for information:\n\n${minors.map(({ x, tag }) => `- [${tag}] ${x.problem}`).join("\n")}\n` : ""}
## 3. What was already known

${WRITE}: what was known before this work that bears on it, including anything that makes the result less than blind -->

## 4. What happens once it is filed

${AFTERWARDS[type] ?? "See the rules."}
`;
}

/** Why the summary cannot yet support an approval, or null when it can. */
export function signoffProblem(dir: string, hash: string, reviews: Review[]): string | null {
  const f = `${dir}/${SIGNOFF}`;
  if (!existsSync(f)) return "no sign-off summary yet: npm run cx -- summary <name>, then write its marked parts";
  const text = readFileSync(f, "utf8");
  if (!text.includes(`Item fingerprint: ${hash}`)) return "the summary was written for a different version of the item; make it again";
  if (text.includes(WRITE)) return "parts of the summary are still to be written (marked WRITE)";
  // Each point's own section, from its heading to the next heading, must carry a written response.
  const sections = new Map(text.split(/^(?=#{2,3} )/m).map((sec) => [sec.match(/^### \[([GS]\d+)\]/)?.[1] ?? "", sec] as const));
  const missing = weighty(reviews).map(({ tag }) => tag).filter((t) => !/\*\*Response:\*\*[ \t]*\S/.test(sections.get(t) ?? ""));
  return missing.length ? `the summary lacks a response to review point(s) ${missing.join(", ")}` : null;
}

export const summaryHash = (dir: string) => createHash("sha256").update(readFileSync(`${dir}/${SIGNOFF}`)).digest("hex");
