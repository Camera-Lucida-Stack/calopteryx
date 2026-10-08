# Scoping note: registering Mertens, Herberz, Hahnel and Brosch (2022) on the effectiveness of nudging

Written 8 October 2026 and agreed by the operator the same day, before any draft was written. Order agreed: nudging, defaults, choice overload. The operator chose consumer behaviour as the topic and this paper as one of three to take up, and confirmed on 8 October 2026 that she has no professional or personal connection with any of its authors.

## The work

Register the central claim of Mertens, S., Herberz, M., Hahnel, U. J. J. and Brosch, T. (2022), "The effectiveness of nudging: A meta-analysis of choice architecture interventions across behavioral domains", Proceedings of the National Academy of Sciences 119(1), e2107346118, doi:10.1073/pnas.2107346118, as corrected by "Correction for Mertens et al.", PNAS 119(19), e2204059119, doi:10.1073/pnas.2204059119 (4 May 2022). A reproduction check may follow, scoped separately.

**The correction changes the claim.** It removed four observations from a retracted study (Shu et al., 2012), fixed two wrong values and some coding errors, and revised the headline figures. The original abstract reported "a small to medium effect size of Cohen's d = 0.45 (95% CI [0.39, 0.52])"; the correction replaces this with "Cohen's d = 0.43 (95% CI [0.38, 0.48])" and the sample with "440 effect sizes (n = 2,148,439)". Calopteryx registers the corrected claim, citing both the paper and the correction (the operator's choice, 8 October 2026).

The corrected Results state: "Our meta-analysis of 447 effect sizes from 212 publications (n = 2, 148, 439) revealed a statistically significant effect… (Cohen's d = 0.43, 95% CI [0.38, 0.48], t(333) = 16.51, P < 0.001)". The corrected paper gives 440 effect sizes in its abstract and 447 in its results and Table 2; the posted data have 447 rows. This inconsistency is noted in the registration's scope, and the registration quotes the corrected Results sentence (447 effect sizes), which matches the posted data (the operator's choice, 8 October 2026), noting the abstract's 440 in its scope.

These quotations were taken from Europe PMC's full text and the correction notice; every character is checked against the published versions before anything is drafted.

## The charter's four questions

1. **Importance.** This is the largest meta-analysis of nudging (744 citations in OpenAlex on 8 October 2026), and nudges are used widely in public policy and in marketing, including food choices, where the paper reports its largest domain effect (corrected d = 0.65, 95% CI 0.47 to 0.83, from 111 effect sizes). It is also directly contested. Three letters in PNAS 119(31) (2022) responded: Maier, Bartoš, Stanley, Shanks, Harris and Wagenmakers, "No evidence for nudging after adjusting for publication bias" (doi:10.1073/pnas.2200300119), whose correction gives d = 0.04 (0.00 to 0.14); Szaszi et al., "No reason to expect large and consistent effects of nudge interventions" (doi:10.1073/pnas.2200732119); and Bakdash and Marusich (doi:10.1073/pnas.2203616119). The authors replied (doi:10.1073/pnas.2202928119), accepting publication bias and heterogeneity as "two highly problematic issues". The claim and the dispute together are among the most consequential in applied behavioural science.
2. **Checkability.** Good. The paper states: "Data have been deposited in the Open Science Framework (https://osf.io/fywae/)." The project holds the corrected effect-size data (mhhb_nma_data_corrected.csv: 447 rows from 212 publications, 1982 to 2021), a record of the corrections, a codebook and the R analysis script. The model is a three-level random-effects model (effect sizes within publications) fitted with the metafor package, with cluster-robust standard errors. The project sets no licence, so a receipt would fetch the files from OSF by fingerprint and never copy them. A reproduction would re-run the authors' script on their corrected data and compare the result with d = 0.43 (0.38 to 0.48).
3. **Competence.** A three-level meta-analysis is within Calopteryx's competence, though it has more parts than a simple one, and the statistics review would cover it. The operator can follow the claim and the dispute about publication bias, and judge a check that compares one figure with another.
4. **Sensitivity.** The data are summary statistics from published studies; no personal data are involved. Calopteryx knows of no relationship between the operator and the authors or the critics, and she confirmed none for the authors. Nothing on the record concerns nudging (all 637 claims searched on 8 October 2026), so the work does not touch Dr Hulme's agents' work.

## The playbook's three further questions

1. **Stakes on the platform.** No claim on the record rests on this one yet.
2. **Is Calopteryx the right agent?** For registration, yes. For a later check, the posted data and code make a reproduction straightforward. Re-running the critics' corrections for publication bias would be a robustness test, worth recording but never counted towards the claim's credence.
3. **What each outcome would add.** Registration puts the corrected headline estimate on the record with a test. The test would be written so that the claim is refuted if the authors' own model, re-run on their corrected posted data, gives a pooled d outside a tolerance set from the corrected figures and interval. Because the critics accept that the pooled estimate follows from the data and dispute what it means, a matching reproduction would settle the narrow question while leaving the dispute open; the registration's caveats say so, and later claims can carry the dispute itself.

## Plan, in order

1. Check every quotation and figure against the published paper and correction, and resolve which effect-size count the registration quotes.
2. Draft the registration (claim.external): the corrected quotation, the source and correction, the scope (effect sizes from 212 publications, 1982 to 2021, search ended June 2019; domains health, food, environment, finance, prosocial and other), the refutation test, and caveats noting the correction and the published dispute.
3. Take it through the checks: the platform's rules, the private rehearsal, the check for private details, the general review and the sign-off summary, then the operator's approval and instruction to send.

Already known: the published and corrected figures, and the three critical letters and the authors' reply.
