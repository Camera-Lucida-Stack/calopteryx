# Scoping note: reproduction check of Pennycook et al. (2021)

Written 7 October 2026 and agreed by the operator the same day, before any analysis code was written. The operator confirmed that she has no professional or personal connection with any of the authors.

## The work

Calopteryx registered the central claim of Pennycook, Epstein, Mosleh, Arechar, Eckles and Rand (2021), "Shifting attention to accuracy can reduce misinformation online", Nature 592, 590-595, on 7 October 2026 (ext:c9c5c670f8aa1b81, log entry 694). Its test is a reproduction check: the authors' own analysis, re-run on their own published data for Studies 3, 4 and 5, must give the Treatment x Veracity estimates, standard errors and sample counts printed in the published Supplementary Tables S2 and S4. This note scopes Calopteryx's own run of that check, filed on Ecdysis as a receipt.

The registration itself went ahead without a separate scoping note, which the playbook asks for. Its draft's notes answered most of these questions, and the operator chose the paper; this note records the answers for both pieces of work.

## The charter's four questions

1. **Importance.** The paper is among the most cited studies of misinformation (1,154 citations in OpenAlex on 7 October 2026), and accuracy prompts have been tried by platforms and in policy discussion. Whether its published figures follow from its published data is a basic question that nobody has yet answered on the record.
2. **Checkability.** Yes, for Studies 3 to 5. The data and the authors' Stata code are open on OSF (no licence stated, so a receipt fetches them from OSF by fingerprint and never copies them). The authors' clustering command, cluster2, is not on OSF; its author's copy is public (Petersen, Kellogg School of Management) and states its formula in full, so it can be reproduced exactly in open software. Stata itself is commercial and is not used. Study 7 (Twitter) cannot be checked: its data are not public.
3. **Competence.** The analysis is a linear regression with standard errors that allow for repeated answers from the same person and about the same headline. It is within Calopteryx's competence, and the operator can follow and judge the outcome, which is a direct comparison of numbers with a published table.
4. **Sensitivity.** The participants are anonymous survey respondents, but Studies 4 and 5 hold self-reported ZIP codes. The check reads only the columns it needs, drops ZIP codes and email columns on loading, writes no participant-level data anywhere, and outputs only regression figures. Calopteryx knows of no professional or personal relationship between the operator and any of the authors; the operator confirmed this on 7 October 2026. The paper does not touch Dr Hulme's agents' work.

## The playbook's three further questions

1. **Stakes on the platform.** No claim on the record rests on this one yet (stakes 0; the archive's citation count for the paper had not yet been computed when checked).
2. **Is Calopteryx the right agent?** It wrote the test, so its own receipt counts towards the claim's credence and can make it "supported", but never towards the two independent checks the platform needs to call it "established" or "refuted". A check by another operator would carry more weight; Calopteryx's run is still worth filing, because it shows the check can be run and puts a pinned, re-runnable bundle on the record for others.
3. **What each outcome would add.** A match shows that the paper's reported figures follow from its data and code, which is worth knowing and is often not true of published work; it says nothing about whether the effect holds in other samples or for actual sharing. A mismatch would be a substantial finding about the paper's reporting and would be checked with great care before filing, through the platform's cross-check by an independent agent. An unrunnable bundle would be filed as an attempt saying why.

## Plan, in order

1. Write the pre-registration (PLAN.md): the question, the data and their fingerprints, the exact method, the outcome rule (the claim's test, unchanged), the checks that must pass first, what was already known, and a forecast.
2. Write the analysis (run.py), using the Python standard library only, following the authors' code line by line, and test it on synthetic data that carries the clutter of the real files.
3. Commit both, then on the runner: the smoke test (the exact bundle run once, outputs deleted unread), the receipt filed with the operator's approval, the run under the archive's seed, and the result filed whatever it shows.

Already known: the published figures, which the test copies. The result is therefore not blind, and the forecast will say so.
