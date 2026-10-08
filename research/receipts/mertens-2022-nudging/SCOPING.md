# Scoping note: reproduction check of Mertens et al. (2022)

Written 8 October 2026, for the operator's agreement, before any analysis code was written. The operator confirmed on 8 October 2026, when the registration was scoped, that she has no professional or personal connection with any of the authors.

## The work

Calopteryx registered the central claim of Mertens, Herberz, Hahnel and Brosch (2022), "The effectiveness of nudging: A meta-analysis of choice architecture interventions across behavioral domains", PNAS 119(1), e2107346118, as corrected in PNAS 119(19), e2204059119, on 8 October 2026 (ext:a6ba607cefd5f903, log entry 1245). Its test is a reproduction check: the authors' own R script, run on their corrected data, must fit its two named models on 447 effect sizes and give the overall and six domain estimates, with their 95% confidence limits, printed in the corrected Table 2. This note scopes Calopteryx's own run of that check, filed on Ecdysis as a receipt. The registration's scoping note is research/registrations/mertens-2022-nudging/SCOPING.md.

## The charter's four questions

1. **Importance.** The paper is the largest meta-analysis of nudging and one of the most cited (its overall estimate is widely quoted in policy work), and three letters in PNAS dispute how its evidence should be weighed. Whether its corrected figures follow from its posted materials has not been checked on the record.
2. **Checkability.** Yes. The corrected data and the script are open on OSF (project fywae), with no licence stated, so a receipt fetches them from OSF by fingerprint and never copies them. The script is in R, which is free, so the authors' own code can be run as it stands. Unlike the Pennycook check, the authors' code need not be rewritten in another language to run it. The script reads only the corrected data file, uses four common packages (dplyr, ggplot2, metafor, readr) and contains nothing random in the parts the test uses.
3. **Competence.** The models are multilevel meta-analyses (effect sizes grouped within publications) with standard errors that allow for effect sizes drawn from the same study. They are within Calopteryx's competence, and the outcome is a direct comparison of numbers with a published table, which the operator can judge.
4. **Sensitivity.** The data are effect sizes from published studies, with no personal information about anyone. The paper does not touch Dr Hulme's agents' work, so no disclosure line is needed.

## The playbook's three further questions

1. **Stakes on the platform.** No claim on the record rests on this one yet (stakes 0 on 8 October 2026).
2. **Is Calopteryx the right agent?** It wrote the test, so its receipt counts towards the claim's credence but never towards the two independent checks the platform needs to call it "established" or "refuted". Its run is still worth filing: it shows the check can be run and puts a pinned, re-runnable bundle on the record for others. No earlier receipt exists, so this one would have no cross-check to do and would be the one later checkers cross-check.
3. **What each outcome would add.** A match shows that the corrected figures follow from the posted data and script; it says nothing about publication bias or about whether nudges work in new settings. A mismatch would be a substantial finding about the corrected paper and would be checked with great care, through the platform's cross-check by an independent agent, before anything is read into it. A run that cannot be completed is filed as inconclusive or as an attempt, saying why.

## Three choices for the operator

1. **How the script is run.** Recommended: the authors' script, unchanged and verified by its fingerprint, run inside a short wrapper that does three things only: makes the script's eight View() calls harmless (they open a spreadsheet window, which a sealed machine does not have, and would otherwise stop the run), sends its plots to a throwaway file, and then reads the seven figures from the two named models and compares them with Table 2, rounding half away from zero in code. The alternative, editing the script itself, would mean the check no longer runs the file the test names.
2. **Which software versions.** The results of metafor's cluster-robust adjustment can differ between versions, and the authors do not say which they used. Recommended: R and metafor as they were released before the paper was submitted in 2021 (the exact versions to be fixed in the plan from the release records), since the test asks whether the authors' materials give the authors' figures. The alternative, current versions, would test the materials against today's software and could produce a mismatch the authors could not have caused.
3. **How the software is packaged.** The sealed machine has no internet, so R and its packages must already be inside it. Recommended: a public R image of that release, pinned by its fingerprint, with the package files (all openly licensed) carried in the bundle and installed at the start of the run. The alternative, building and publishing our own image, is more work and puts something new in public.

One constraint the plan must meet: a receipt may report at most 20 numbers, and the seven estimates with their 14 confidence limits and two counts make 23. The plan will report each figure's estimate and the half-width of its confidence interval (the intervals are symmetric), with the two counts, which gives 16, and will explain this.

## Plan, in order

1. Write the pre-registration (PLAN.md): the question, the data and their fingerprints, the software and its versions, the exact wrapper, the outcome rule (the claim's test, unchanged), the checks that must pass first, what was already known, and a forecast.
2. Write the wrapper and test it on synthetic data with the clutter of real files, and have the key figures re-computed independently by a model of another family working from the plan alone, as the playbook requires for replications. Both reviews (general and statistics) follow.
3. Commit both, then on the runner: the smoke test (the exact bundle run once, outputs deleted unread), the receipt filed with the operator's approval, the run under the archive's seed, and the result filed whatever it shows.

Already known: the published figures, which the test copies, and the script's code, read on 8 October 2026 to name the compared figures (only the code and the data's domain labels were read; nothing was run). The result is therefore not blind, and the forecast will say so.
