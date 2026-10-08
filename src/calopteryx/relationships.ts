// Disclosure of the operator's relationship with Dr Hulme (PLAYBOOK.md, "Independence and disclosure"). Since 8 October
// 2026 (Lucy) every item that touches a claim, receipt or argument of his agents states the relationship in one line of its
// own text. The tool finds such items at each rehearsal and says so in the rehearsal and the sign-off summary, but no
// longer refuses approval without the line, and no longer lists filed items in records/relationships.csv. The receipt that
// was in progress on that date is finished under the rules it began under (EARLIER_RULES): for it, approval still needs
// the disclosure, and once filed it is still listed.
// His agents are every agent registered under his operator id, looked up from the record at each rehearsal.
import type { PrivateCopy } from "./rehearse.js";

export const HULME_OPERATOR = "op_225d348d88e2d6b727580ffc";

type Rec = Awaited<ReturnType<PrivateCopy["v2"]["record"]>>;
type Scores = Awaited<ReturnType<PrivateCopy["v2"]["scoresFor"]>>;

export function agentsOf(r: Rec, operatorId: string): string[] {
  return [...r.agents].filter(([, a]) => a.operatorId === operatorId).map(([h]) => h).sort();
}

/** Who authored a claim on the record: its publisher, or for a claim from the literature, its registrant. */
function claimOperator(r: Rec, ref: string): string | null {
  const id = ref.split("#")[0]!;
  return r.native.get(id)?.operatorId ?? r.external.get(id)?.operatorId ?? null;
}

/** Every way the item bears on work by the operator's agents, in words. */
export function touches(r: Rec, p: Record<string, any>, operatorId: string): string[] {
  const out: string[] = [];
  const claim = (ref: unknown, what: string) => {
    if (typeof ref === "string" && claimOperator(r, ref) === operatorId) out.push(`${what} ${ref} is by ${handleOf(r, ref)}`);
  };
  const handleOf = (r: Rec, ref: string) => { const id = ref.split("#")[0]!; return r.native.get(id)?.handle ?? r.external.get(id)?.handle ?? "?"; };
  switch (p.type) {
    case "check.commit": {
      claim(p.target, "the claim checked,");
      const theirs = (r.receiptsByClaim.get(String(p.target).split("#")[0]!) ?? []).filter((x) => x.operatorId === operatorId);
      if (theirs.length) out.push(`${theirs.length} earlier receipt(s) on this claim are by his agents, and the seal may assign one to cross-check`);
      break;
    }
    case "check.result": {
      const c = r.checks.get(p.commit);
      if (c) claim(c.target, "the claim checked,");
      const x = p.crossCheck?.receipt ? r.checks.get(p.crossCheck.receipt) : null;
      if (x?.operatorId === operatorId) out.push(`the receipt cross-checked (${p.crossCheck.receipt.slice(0, 12)}…) is by ${x.handle}`);
      break;
    }
    case "review": case "check.attempt": case "argument.file": case "attempt.clear": claim(p.claim, "the claim"); break;
    case "argument.check": {
      const g = r.arguments.get(p.argument);
      if (g?.operatorId === operatorId) out.push(`the argument checked is by ${g.handle}`);
      if (g) claim(g.claim, "the claim argued about,");
      break;
    }
    case "claim.link": claim(p.from, "the citing claim"); claim(p.to, "the claim relied on"); break;
    case "claim": for (const b of p.builds_on ?? []) claim(b?.id, "a claim built on,"); break;
    case "issue.flag": claim(p.subject, "the item flagged,"); break;
  }
  return out;
}

/** The facts the rule compares, copied out of the record so that a later change to it cannot alter them. */
export interface Snapshot { claims: Map<string, { status: string; resolved: number | null; op: string | null }>; args: Map<string, { status: string; op: string; claimOp: string | null }>; checks: Map<string, { handle: string; op: string; verified: number; disputed: number }>; findings: number }
export function snapshot(r: Rec, s: Scores): Snapshot {
  return {
    claims: new Map([...s.claims].map(([ref, c]) => [ref, { status: c.status, resolved: c.resolved, op: claimOperator(r, ref) }])),
    args: new Map([...r.arguments].map(([id, g]) => [id, { status: g.status, op: g.operatorId, claimOp: claimOperator(r, g.claim) }])),
    checks: new Map([...r.checks].map(([id, c]) => [id, { handle: c.handle, op: c.operatorId, verified: c.verifiedBy.length, disputed: c.disputedBy.length }])),
    findings: r.findings.length,
  };
}

/** What accepting the item changed, on work by the operator's agents. */
export function changes(b: Snapshot, a: Snapshot, operatorId: string): string[] {
  const out: string[] = [];
  for (const [ref, x] of b.claims) {
    const y = a.claims.get(ref);
    if (!y || x.op !== operatorId) continue;
    if (y.status !== x.status) out.push(`the claim ${ref} would move from ${x.status} to ${y.status}`);
    else if (y.resolved !== x.resolved) out.push(`the claim ${ref} would resolve`);
  }
  for (const [id, x] of b.args) {
    const y = a.args.get(id);
    if (y && y.status !== x.status && (x.op === operatorId || x.claimOp === operatorId)) out.push(`the argument ${id.slice(0, 12)}… would move from ${x.status} to ${y.status}`);
  }
  for (const [id, x] of b.checks) {
    const y = a.checks.get(id);
    if (!y || x.op !== operatorId) continue;
    if (y.verified !== x.verified) out.push(`the receipt ${id.slice(0, 12)}… by ${x.handle} would be verified`);
    if (y.disputed !== x.disputed) out.push(`the receipt ${id.slice(0, 12)}… by ${x.handle} would be disputed`);
  }
  if (a.findings !== b.findings) out.push("a finding would open");
  return out;
}

export interface Relationship { operator: string; agents: string[]; touches: string[]; changes: string[] }

/** The filed field that carries the disclosure, for each kind of item that has free text. */
export const DISCLOSURE_FIELD: Record<string, string> = {
  "check.commit": "methods", review: "rationale", "check.attempt": "detail", "argument.file": "text", "argument.check": "note",
  "argument.answer": "text", claim: "method", "issue.flag": "detail",
};
export const AUDIT_LOG = "records/relationships.csv";

/** Drafts finished under the rules of 6 October 2026: the disclosure gate and the audit log apply to these only (Lucy, 8 October 2026). */
export const EARLIER_RULES = new Set(["pennycook-2021-receipt", "pennycook-2021-receipt-result"]);

/** Why the item's text fails to disclose the relationship it needs to, or null. */
export function disclosureProblem(p: Record<string, any>, rel: Relationship): string | null {
  if (!rel.touches.length) return null;
  const f = DISCLOSURE_FIELD[p.type];
  if (!f) return null;          // no free text (a result, a link): the disclosure is carried by the commitment or the summary
  return typeof p[f] === "string" && /\bHulme\b/.test(p[f]) ? null
    : `this item touches work by Dr Hulme's agents (${rel.touches.join("; ")}), so its ${f} must disclose the operator's relationship with Dr Hulme`;
}

export async function assess(copy: PrivateCopy, p: Record<string, any>, apply: () => Promise<{ accepted: boolean }>): Promise<{ relationship: Relationship }> {
  const r0 = await copy.v2.record();
  const before = snapshot(r0, await copy.v2.scoresFor(r0));
  const agents = agentsOf(r0, HULME_OPERATOR);
  const t = touches(r0, p, HULME_OPERATOR);
  const res = await apply();
  const r1 = await copy.v2.record();
  const c = res.accepted ? changes(before, snapshot(r1, await copy.v2.scoresFor(r1)), HULME_OPERATOR) : [];
  return { relationship: { operator: HULME_OPERATOR, agents, touches: t, changes: c } };
}
