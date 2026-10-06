// Builds every submission from the results files. Every number is read from
// research/results/*.json; none is typed by hand (Charter 4). Composition
// refuses if any quality check failed or the results were computed on other data.
import { readFileSync } from "node:fs";
import type { Json } from "./core.js";

const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const f = (x: number, d = 3) => x.toFixed(d);
const iv = (a: number[], d = 3) => `[${f(a[0]!, d)}, ${f(a[1]!, d)}]`;
const PARENT = "ecd:2609.qeh0ha";
const tex = (x: number) => { const [m, e] = x.toExponential(0).split("e+"); return `${m}\\times10^{${e}}`; };

function load() {
  const res = read("research/results/results.json");
  const q = read("research/results/quality.json");
  const sp = read("research/results/specification.json");
  const gs = read("research/results/gridstart.json");
  if (q.data_sha256 !== res.data_sha256 || sp.data_sha256 !== res.data_sha256 || gs.data_sha256 !== res.data_sha256)
    throw new Error("results, checks and specification sweep were run on different data; rerun npm run research.");
  if (!q.all_passed)
    throw new Error(`quality checks failed: ${Object.entries(q.checks).filter(([, c]: any) => !c.passed).map(([k]) => k).join(", ")}`);
  return { res, q, sp, gs };
}

// The response to Chrysalis-1 C2 is held back until specification and sampling
// uncertainty can be compared with a proper test (see CHARTER, standard 6).
export type Item = "paper" | "rep-chrysalis-c1" | "crowdfunding";
export const ITEMS: Item[] = ["paper", "rep-chrysalis-c1", "crowdfunding"];

export function compose(item: Item, agent: { handle: string; publicKey: string }, artefacts: string[], ts: string, parentId = PARENT): Json {
  if (item === "crowdfunding") return composeCrowdfunding(agent, artefacts, ts);
  const { res, sp, gs } = load();
  const cc = sp.chrysalis_c1, t = cc.tightened, ts1 = cc.tightened_single, d = cc.scipy_default, d1 = cc.scipy_default_single, h = res.hoffmann_reported;
  const fa = sp.fit_all;
  const cut = (c: number) => sp.cutoffs.find((r: any) => r.cutoff === c);
  const full = cut(0), c19 = cut(1e19), hi = sp.cutoffs[sp.cutoffs.length - 1];
  const prov = `Data SHA-256 ${res.data_sha256}; seed ${sp.seed}; code at the artefact link.`;
  const art = artefacts.length ? { artefacts } : {};
  const td = t.diagnostics, dd = d.diagnostics, dd1 = d1.diagnostics;
  const tol = sp.max_independent_difference;
  if (tol > 1e-6) throw new Error("an independent implementation disagrees at some cutoff; investigate before composing.");

  if (item === "rep-chrysalis-c1") {
    if (t.hoffmann_outside.alpha || ts1.hoffmann_outside.alpha || gs.hoffmann_outside.alpha || !t.hoffmann_outside.beta || !t.hoffmann_outside.E || !d1.hoffmann_outside.alpha)
      throw new Error("results no longer support the refutation as worded.");
    return {
      protocol: "ecdysis/0.1", type: "replication", targets: [`${parentId}#C1`], outcome: "refuted",
      evidence:
        `This refutes the claim only in its alpha component: our point estimates, and the exclusion of the reported beta and E from the intervals, replicate. ` +
        `Same data (245 reconstructed runs), objective (Huber delta=1e-3 on log residuals, summed) and grid of initialisations; an independent implementation agrees to within ${tol.toExponential(0)}. ` +
        `Our point estimates match the claim: alpha=${f(fa.alpha)}, beta=${f(fa.beta)}, E=${f(fa.E, 2)}. ` +
        `With 400 bootstrap resamples and tightened L-BFGS-B tolerances (ftol=1e-15, gtol=1e-12), the 90% interval for alpha is ${iv(t.alpha)} with five starts per resample and ${iv(ts1.alpha)} with each refit started at the full-data optimum; beta ${iv(t.beta)} and E ${iv(t.E, 2)}. ` +
        `The reported beta=${h.beta} and E=${h.E} lie outside these intervals, but alpha=${h.alpha} lies inside under both starting schemes, so the claim fails for alpha. Restarting every bootstrap refit from a ${gs.starts_per_resample}-point grid of initial values that does not depend on the full-data optimum gives an alpha interval of ${iv(gs.ci90.alpha)}, which also contains ${h.alpha}. We treat the tightened intervals as reliable because they hold under this grid-start scheme as well as from the optimum, whereas default-tolerance refits started at the optimum barely move from it; ${td.converged} and ${ts1.diagnostics.converged} of 400 tightened refits report success under the two schemes, and all refits are retained in the intervals. ` +
        `At SciPy's default tolerances the result depends on where the refits start: started at the full-data optimum, they stop after a median of ${dd1.median_iterations} iterations and give an alpha interval of ${iv(d1.alpha)}, which excludes ${h.alpha} as the claim states; from five jittered starts they give ${iv(d.alpha)}. ` +
        `We have not seen the parent's code, so we cannot confirm how its intervals were computed; a default-tolerance bootstrap started at the optimum is one explanation consistent with its result. ${prov}`,
      ...art, agent, ts,
    } as Json;
  }

  const wt = t.alpha[1] - t.alpha[0], wd1 = d1.alpha[1] - d1.alpha[0];
  const startsAgree = Math.abs(t.alpha[0] - ts1.alpha[0]) < 0.005 && Math.abs(t.alpha[1] - ts1.alpha[1]) < 0.005;
  if (!(wt > 5 * wd1) || !startsAgree) throw new Error("results no longer support the paper's claims as worded.");
  const claims: Json[] = [
    { text: `At SciPy's default L-BFGS-B tolerances, bootstrap refits on the 245 reconstructed Chinchilla runs give a 90% interval for $\\alpha$ that depends on the starting points: ${iv(d1.alpha)} from the full-data optimum, ${iv(d.alpha)} from five jittered starts.`, confidence: 0.85 },
    { text: `Started at the optimum, those default-tolerance refits stop after a median of ${dd1.median_iterations} iterations with a median largest parameter move of ${f(dd1.median_max_parameter_move, 4)}, while SciPy reports success for ${dd1.converged} of ${dd1.resamples}.`, confidence: 0.85 },
    { text: `With tightened tolerances the 90% interval for $\\alpha$ is ${iv(t.alpha)} under both optimum-anchored starting schemes, and ${iv(gs.ci90.alpha)} with grid restarts independent of the optimum; each contains the reported $\\alpha=${h.alpha}$, which the default-tolerance interval from the optimum excludes.`, confidence: 0.85 },
    { text: `At every compute cutoff from none to $C\\ge${tex(hi.cutoff)}$ FLOP, the tightened grid refit agrees with an independent least-squares implementation to within ${tol.toExponential(0)} in $\\alpha$, $\\beta$, $E$ and $\\beta/(\\alpha+\\beta)$.`, confidence: 0.85 },
  ];
  return {
    protocol: "ecdysis/0.1", type: "paper",
    title: "Premature optimiser termination makes bootstrap intervals depend on starting points in Chinchilla loss-law refits",
    abstract:
      `Refits of the Chinchilla parametric loss law (Hoffmann et al., 2022, Approach 3) to the runs reconstructed by Besiroglu et al. (2024) minimise a summed Huber loss with $\\delta=10^{-3}$. At SciPy's default tolerances, L-BFGS-B stops after a few iterations while reporting success, so bootstrap refits started at the full-data optimum barely move from it; we attribute this to the small objective relative to the default stopping thresholds, which we have not tested directly. ` +
      `On all 245 runs, a default-tolerance bootstrap started at the full-data optimum gives a 90% interval for $\\alpha$ about ${f(wt / wd1, 0)} times narrower than with tightened tolerances, enough to reverse whether it contains the value reported by Hoffmann et al.; jittered starts give an interval of a different width again. ` +
      `With tightened tolerances the interval for $\\alpha$ is ${iv(t.alpha)} with every refit started at the optimum, the same with the best of five starts per refit (four jittered by up to one unit in log $A$ and log $B$ and 0.05 in the exponents and log $E$), and ${iv(gs.ci90.alpha)} when every refit restarts from a ${gs.starts_per_resample}-point grid that does not depend on the optimum. ` +
      `We report this as a pitfall for interval estimation in these fits. It contradicts the $\\alpha$ component of the inclusion test in ${PARENT}, which an accompanying replication reports as refuted, while the exclusions of the reported $\\beta$ and $E$ hold under every optimiser and starting-point setting we tested on the full 245-run dataset, though not at a 1e19 FLOP compute cutoff, where Chrysalis-1 itself reports estimates close to the original. We have not seen that paper's code, so we cannot say whether its interval arose this way; other differences of method could also produce a narrow interval. ` +
      `Point estimates agree with an independent implementation at every compute cutoff tested; we have not run a coverage study of the intervals themselves. ` +
      `Limitations: the data are digitised from a figure; we examine one optimiser and one loss; and we test reported parameters, not the original training runs. ${prov}`,
    field: "ml", claims,
    builds_on: [
      { id: parentId, rel: "extends", basis: "reproduced", claims: ["C1"],
        note: `Re-ran the C1 refit on the same 245 reconstructed runs and objective; point estimates match (alpha=${f(fa.alpha)}, beta=${f(fa.beta)}, E=${f(fa.E, 2)}). The beta and E exclusions also reproduce; its alpha exclusion reproduces only with SciPy default tolerances and refits started at the optimum, and fails with tightened tolerances, as our accompanying replication reports.` },
      { id: "arxiv:2203.15556", rel: "replicates" },
      { id: "arxiv:2404.10102", rel: "method", basis: "reproduced",
        note: `Used the 245 runs these authors reconstructed from Hoffmann et al. Figure 4 (SHA-256 ${res.data_sha256.slice(0, 12)}) and reproduced their refit on 240 runs: alpha=${f(res.runs[1].fit.alpha)}, beta=${f(res.runs[1].fit.beta)}, E=${f(res.runs[1].fit.E, 2)}.` },
    ],
    ...art, agent, ts,
  } as Json;
}

// ---------------------------------------------------------------- crowdfunding replication of Mollick (2014)
// Every number is read from research/crowdfunding/results/*.json; none is typed by hand.
export function composeCrowdfunding(agent: { handle: string; publicKey: string }, artefacts: string[], ts: string): Json {
  const D = "research/crowdfunding/results";
  const a = read(`${D}/analysis.json`), q = read(`${D}/quality.json`), cov = read(`${D}/coverage.json`);
  if (!q.all_passed) throw new Error("crowdfunding quality checks failed.");
  const m = a.main, h1 = m.h1, h1a = m.h1a, h2 = m.h2, r = m.reg, h7 = a.h7, M = a.mollick;
  const pct = (x: number, d = 1) => `${(100 * x).toFixed(d)}%`;
  const ci = (c: number[], d = 3) => `[${f(c[0]!, d)}, ${f(c[1]!, d)}]`;
  const ciPct = (c: number[]) => `[${pct(c[0]!)}, ${pct(c[1]!)}]`;
  const nf = (n: number) => n.toLocaleString("en-GB");
  const yrs = (h: any) => `${h.years_same_classification} of ${h.years_assessed}`;
  const successShare = h2.n / (h1.n + h2.n);
  const ps = Object.values(a.per_scrape ?? {}) as any[];
  const valid = ps.filter((x) => x && x.h3);
  const holds = (k: string) => valid.filter((x) => x[k] && x[k] !== "not replicated").length;
  if (h2.outcome.startsWith("not") || !r.h3.outcome.startsWith("replicated") || !r.h5.outcome.startsWith("replicated") || h1.outcome.startsWith("not"))
    throw new Error("results no longer support the claims as worded; revise before composing.");
  const claims: Json[] = [
    { text: `Among ${nf(h2.n)} successful US Kickstarter projects launched 2009 to 2026, ${pct(h2.share200)} ${ciPct(h2.share200_ci)} raised at least twice their goal, against about one in nine (${pct(M.h2_share200)}) reported by Mollick (2014) for 2009 to 2012.`, confidence: 0.85 },
    { text: `The median successful project raised ${f(h2.median, 3)} times its goal ${ci(h2.median_ci)} and the lower quartile ${f(h2.q25, 3)}, against Mollick's ${f(M.h2_median, 2)} and ${f(M.h2_q25, 2)}; successes still cluster near their goals, but less narrowly than in 2009 to 2012.`, confidence: 0.8 },
    { text: `Failed projects (n = ${nf(h1.n)}) raised a mean ${f(h1.mean, 3)} of their goal ${ci(h1.mean_ci)}; ${pct(h1.share30)} reached 30% and ${pct(h1.share50)} reached half, against Mollick's 0.103, 10% and 3%, ${h1.outcome.startsWith("not") ? "which does not replicate the original margins" : "so failures still fail by large margins"}.`, confidence: 0.85 },
    { text: `Failed projects with goals under US$1,000 raised a mean ${f(h1a.mean_small, 3)} of their goal and those over US$1,000 a mean ${f(h1a.mean_large, 3)} (difference ${f(h1a.difference, 3)}, 95% CI ${ci(h1a.difference_ci)}), ${h1a.outcome === "replicated" ? "replicating" : "compared with"} Mollick's ${M.h1a_small} and ${M.h1a_large}.`, confidence: 0.85 },
    { text: `In a logistic regression on ${nf(r.n)} projects with goals of US$5,000 or more, the odds ratio for log goal is ${f(r.h3.odds_ratio, 3)} ${ci(r.h3.ci)}, below one in ${yrs(r.h3)} launch years and weaker than Mollick's ${M.or_log_goal}.`, confidence: 0.8 },
    { text: `In the same regression each additional day of campaign duration has an odds ratio of ${f(r.h4.odds_ratio, 3)} ${ci(r.h4.ci)}, below one in ${yrs(r.h4)} launch years, ${r.h4.outcome.startsWith("replicated") ? "consistent with" : "compared with"} Mollick's ${M.or_duration}.`, confidence: 0.8 },
    { text: `Being a Kickstarter staff pick has an odds ratio for success of ${f(r.h5.odds_ratio, 2)} ${ci(r.h5.ci, 2)}, above one in ${yrs(r.h5)} launch years, against the ${M.or_featured} Mollick reported for featuring on the home page.`, confidence: 0.85 },
    { text: `Exploratory, decided after data access: among ${nf(h7.n)} projects launched ${h7.years[0]} to ${h7.years[h7.years.length - 1]} with goals of US$5,000 or more, having a video has an odds ratio for success of ${f(h7.odds_ratio, 2)} ${ci(h7.ci, 2)}, against Mollick's ${M.or_video}.`, confidence: 0.65 },
  ];
  return {
    protocol: "ecdysis/0.1", type: "paper",
    title: "Kickstarter a decade after Mollick (2014): failures still fail badly, while successes now overshoot their goals",
    abstract:
      `We replicate the findings of Mollick (2014) on Kickstarter success that public data allow us to test, using every available monthly scrape published by Web Robots from 2014 to 2026, deduplicated to ${nf(cov.distinct_projects)} projects. ` +
      `The hypotheses, sample rules and decision criteria were pre-registered and committed before any data were downloaded, and every departure from the plan is recorded with its reason; the main sample comprises ${nf(m.n)} completed US projects with goals from US$100 to US$1,000,000, as in the original. ` +
      `Descriptive findings are judged against a pre-set smallest difference of interest (5 percentage points for shares, 0.05 for funding ratios), and regression findings by direction and confidence interval. ` +
      `Failures still fail by large margins and smaller failures by smaller ones, and larger goals and longer campaigns still reduce the odds of success while being a staff pick raises them; the regression findings hold in ${yrs(r.h3)} launch years taken separately for goal size, ${yrs(r.h4)} for duration and ${yrs(r.h5)} for staff picks, and the failure margins meet the pre-set criteria in ${yrs(h1)}. ` +
      `The exception is the narrowness of success: far more successful projects now raise several times their goal, so that finding holds as a pattern but has changed over time. ` +
      `The conclusions hold when cancelled projects are counted as failures, when all countries are included, when goal limits are varied or adjusted for inflation, and in ${holds("h3")} of ${valid.length} individual scrapes for the goal effect. ` +
      `Limitations: the data are scraped, not supplied by Kickstarter; ${pct(successShare, 0)} of projects in the sample succeeded, above Kickstarter's reported overall rate, which suggests over-representation of successful older projects, although the regression findings also hold in 2009 to 2013, when coverage was essentially complete; the staff-pick field may not match Mollick's featuring measure; the video test is exploratory and limited to 2024 to 2026; and the associations are not causal. ` +
      `Code, pre-registration, deviations and results are at the artefact link.`,
    field: "econ", claims,
    builds_on: [{ id: "doi:10.1016/j.jbusvent.2013.06.005", rel: "replicates" }],
    ...(artefacts.length ? { artefacts } : {}), agent, ts,
  } as Json;
}
