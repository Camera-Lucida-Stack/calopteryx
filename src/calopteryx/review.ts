// The reviews (PLAYBOOK.md, "The review" and "Statistical practice"), through OpenRouter. The general review, by a model
// of another family, is required for every item; the specialist statistics review, by a model of a third family, is
// required for receipts and new research claims and runs on request for anything else (Lucy, 6 October 2026).
// Each item receives one review; a second round is allowed only when the first found something blocking.
// The cost of every call, as OpenRouter charged it, is appended to records/costs/reviews.csv for the monthly report.
import { readFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";

export interface Reviewer { role: "general" | "statistics"; model: string; name: string }
export const GENERAL: Reviewer = { role: "general", model: "openai/gpt-6.1-sol", name: "OpenAI GPT-6.1 Sol" };
export const STATISTICS: Reviewer = { role: "statistics", model: "deepseek/deepseek-v4-pro-0813", name: "DeepSeek V4 Pro" };
/** Receipts and new research claims always receive the statistics review. */
export const STATISTICS_REQUIRED = new Set(["check.commit", "check.result", "claim"]);
export const COST_LOG = "records/costs/reviews.csv";

export interface Issue { severity: "blocking" | "major" | "minor"; nature: "clear error" | "judgement call"; location: string; problem: string; fix: string }
export interface Review { reviewer: Reviewer; instructions: string; issues: Issue[]; better_method: string; summary: string; cost: number | null; generation: string | null; tokens: { prompt: number; completion: number }; messages: { role: string; content: string }[] }

// The reviewers' exact instructions are kept in reviewers/<role>.txt, so every test can be repeated word for word; each
// review records the SHA-256 of the instructions it was given, and the exact messages sent are saved beside it.
export const INSTRUCTIONS_DIR = "reviewers";
export function instructions(r: Reviewer): { text: string; sha256: string } {
  const text = readFileSync(`${INSTRUCTIONS_DIR}/${r.role}.txt`, "utf8");
  return { text, sha256: createHash("sha256").update(text).digest("hex") };
}

export function attachmentsOf(paths: string[]): { path: string; sha256: string; text: string }[] {
  return paths.map((p) => {
    if (!existsSync(p)) throw new Error(`attachment not found: ${p}`);
    const text = readFileSync(p, "utf8");
    return { path: p, sha256: createHash("sha256").update(text).digest("hex"), text };
  });
}

export function prompt(r: Reviewer, item: unknown, context: string, attachments: { path: string; text: string }[]) {
  const user = [`<item>\n${JSON.stringify(item, null, 2)}\n</item>`, `<context>\n${context}\n</context>`,
    ...attachments.map((x) => `<attachment path="${x.path}">\n${x.text}\n</attachment>`)].join("\n\n");
  return [{ role: "system", content: instructions(r).text }, { role: "user", content: user }];
}

type Call = (model: string, messages: { role: string; content: string }[]) => Promise<{ text: string; cost: number | null; generation: string | null; prompt: number; completion: number }>;

/** One call to OpenRouter. The key is read from the environment and never shown. */
export const openRouter: Call = async (model, messages) => {
  const key = process.env["OPENROUTER_API_KEY"];
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, response_format: { type: "json_object" }, usage: { include: true } }),
  });
  if (!r.ok) throw new Error(`OpenRouter refused the request: ${r.status} ${(await r.text()).slice(0, 300)}`);
  const j = (await r.json()) as { id?: string; choices?: { message?: { content?: string } }[]; usage?: { cost?: number; prompt_tokens?: number; completion_tokens?: number } };
  let cost = typeof j.usage?.cost === "number" ? j.usage.cost : null;
  if (cost === null && j.id) {                                   // the charge, as recorded, when the reply did not carry it
    for (let i = 0; i < 5 && cost === null; i++) {
      await new Promise((ok) => setTimeout(ok, 2000));
      const g = await fetch(`https://openrouter.ai/api/v1/generation?id=${j.id}`, { headers: { authorization: `Bearer ${key}` } });
      if (g.ok) { const d = ((await g.json()) as { data?: { total_cost?: number } }).data; if (typeof d?.total_cost === "number") cost = d.total_cost; }
    }
  }
  return { text: j.choices?.[0]?.message?.content ?? "", cost, generation: j.id ?? null, prompt: j.usage?.prompt_tokens ?? 0, completion: j.usage?.completion_tokens ?? 0 };
};

/** A stand-in reviewer for tests: no network, no cost, nothing logged. */
export const standIn = (issues: Issue[] = []): Call => async () =>
  ({ text: JSON.stringify({ issues, better_method: "none", summary: "stand-in review" }), cost: 0, generation: null, prompt: 0, completion: 0 });

function parse(text: string): Pick<Review, "issues" | "better_method" | "summary"> {
  const j = JSON.parse(text.replace(/^```(json)?|```$/gm, "").trim());
  if (!Array.isArray(j.issues)) throw new Error("the reviewer's reply had no list of issues");
  for (const i of j.issues) if (!["blocking", "major", "minor"].includes(i.severity)) throw new Error(`the reviewer gave an unknown severity: ${i.severity}`);
  return { issues: j.issues, better_method: String(j.better_method ?? ""), summary: String(j.summary ?? "") };
}

export async function review(r: Reviewer, item: unknown, context: string, attachments: { path: string; text: string }[], o: { call?: Call; label: string }): Promise<Review> {
  const call = o.call ?? openRouter;
  const messages = prompt(r, item, context, attachments);
  const res = await call(r.model, messages);
  if (call === openRouter) logCost(o.label, r, res);
  return { reviewer: r, instructions: instructions(r).sha256, ...parse(res.text), cost: res.cost, generation: res.generation,
    tokens: { prompt: res.prompt, completion: res.completion }, messages };
}

function logCost(label: string, r: Reviewer, x: { cost: number | null; generation: string | null; prompt: number; completion: number }) {
  mkdirSync("records/costs", { recursive: true });
  if (!existsSync(COST_LOG)) appendFileSync(COST_LOG, "at,item,role,model,prompt_tokens,completion_tokens,cost_usd,generation\n");
  appendFileSync(COST_LOG, [new Date().toISOString(), label, r.role, r.model, x.prompt, x.completion, x.cost ?? "unknown", x.generation ?? ""].join(",") + "\n");
}

/** Spending on reviews by month, from the cost log: the monthly report the playbook promises. */
export function costReport(month?: string): string {
  if (!existsSync(COST_LOG)) return "No reviews have been paid for yet.";
  const rows = readFileSync(COST_LOG, "utf8").trim().split("\n").slice(1).map((l) => l.split(","))
    .filter((c) => !month || c[0]!.startsWith(month));
  const by = new Map<string, { n: number; usd: number; unknown: number }>();
  for (const c of rows) {
    const k = `${c[0]!.slice(0, 7)} ${c[2]} (${c[3]})`;
    const v = by.get(k) ?? { n: 0, usd: 0, unknown: 0 };
    v.n++; if (c[6] === "unknown") v.unknown++; else v.usd += Number(c[6]);
    by.set(k, v);
  }
  const total = [...by.values()].reduce((s, v) => s + v.usd, 0);
  return [...[...by].map(([k, v]) => `${k}: ${v.n} review(s), $${v.usd.toFixed(4)}${v.unknown ? ` (${v.unknown} with cost not reported)` : ""}`), `Total: $${total.toFixed(4)}`].join("\n");
}
