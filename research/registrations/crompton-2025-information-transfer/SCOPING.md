# Scoping note: registering Crompton et al. (2025) on information transfer between autistic and non-autistic people

Written 24 October 2026 and agreed by the operator the same day, after her correction of how its importance was described, before any draft was written. The operator chose this paper on 24 October 2026 from the shortlist in research/candidates/2026-10-24-shortlist.md, and confirmed the same day that she has no professional or personal connection with any of its authors.

## The work

Register a central claim of Crompton, C. J. et al. (2025), "Information transfer within and between autistic and non-autistic people", Nature Human Behaviour 9(7), 1488-1500, doi:10.1038/s41562-025-02163-z (published 14 May 2025; CC BY 4.0; Crossref records no correction). It is a Registered Report: its protocol was accepted by the journal on 23 August 2022, before any data were collected. It replicates and extends Crompton et al. (2020, Autism 24(7), 1704-1712), which found that information passed along mixed autistic and non-autistic chains declined faster than along chains of one neurotype. A reproduction check may follow, scoped separately.

The claim, as the abstract states it (identical in Crossref's deposited abstract, which the quote scout reads): "We found no difference in information transfer between single-neurotype and mixed-neurotype chains."

What lies behind it (Results, "Information transfer"): 311 adults (154 autistic, 157 non-autistic) in 54 chains of up to six people, at Edinburgh, Nottingham and Dallas, each passing on a fictional and a factual story, scored out of 30. For each story the authors fitted a multilevel model, score ~ chain type × log(order) + site × info × first + (1 + log(order) | chain), in R with lme4, testing at P < 0.05. In both stories, chain type had no significant effect (Bayes factors of 7.91 and 125.0 in favour of the simpler model), and the interaction between mixed chains and position in the chain, the paper's main prediction, was not significant. Two points a fair test must keep in view: in the fictional story an unpredicted interaction did reach significance, with autistic chains losing detail slightly faster than non-autistic chains (b = −1.73, P = 0.042), which concerns autistic chains, not mixed ones; and Bayes factors are computed by random sampling, so they vary slightly from run to run and need a tolerance or must be left out of the test.

Data period: "Participants were recruited between August 2022 and October 2023" (Methods, "Timeline").

## The charter's four questions

1. **Importance.** The 2020 study is widely cited (523 citations in OpenAlex), and this Registered Report, with more than four times its sample, is the stronger test of what it measured. What both studies measure is specific: how much of a story survives being retold along a chain of people in a one-way task, and how much rapport participants report. Neither tests the "double empathy" account, and this paper makes no claim about it. The authors' conclusion keeps to the task: "The experimental context tested here may have failed to capture difficulties experienced in real-world cross-neurotype interactions. This could be due to real-world conversations being more dynamic and interactive than the unidirectional information transfer tasks used here." The 2020 finding is often cited in discussions of double empathy, so the record gains from stating precisely what the newer, larger study did and did not find, without extending it to the wider account. The paper is recent (38 citations).
2. **Checkability.** Good. The anonymised data (DISI_Core_Dataset.csv, with a data dictionary) and the authors' R scripts for each analysis are on OSF (osf.io/us9c7), as the paper's data and code statements say. The OSF project sets no licence, so files would be named by fingerprint and fetched from source, never copied, as for Jachimowicz. The test can name the authors' own model and their own significance threshold.
3. **Competence.** Multilevel models are within Calopteryx's competence, and a re-run of the authors' scripts is a direct comparison with printed figures. The operator works within the neurodiversity paradigm and can judge both the claim and its framing closely.
4. **Sensitivity.** High, and handled as follows. The research concerns autistic people, a group often described in deficit terms: every text Calopteryx writes uses neurodiversity-affirming language and avoids deficit framing, and it will be careful not to present a finding of "no difference" as a verdict on autistic people's communication in general. The data are anonymised participant records, including age, gender, ethnicity, IQ and site: only the fields the analysis needs will be read, nothing will be done to identify anyone, and only aggregate results will be reported. The operator has no connection with the authors. Nothing on the record concerns this topic (all 9,104 log entries searched on 24 October 2026), so the work does not touch Dr Hulme's agents' work.

## The playbook's three further questions

1. **Stakes on the platform.** Nothing on the record concerns autism, neurodiversity or information transfer, so no claim rests on this one yet. It would open the topic.
2. **Is Calopteryx the right agent?** For registration, yes: the claim, data, code and period are all clear. A later check by Calopteryx would count towards the claim's credence but never towards the independent checks needed to establish or refute it.
3. **What each outcome would add.** At the first of Lucy's three levels (the original data, analysed as reported), the test would ask whether the authors' scripts, re-run on their data, reproduce the reported results, including the absence of a significant difference for mixed chains. At the second (new data from the same period), Ecdysis would count another study of adults recruited between August 2022 and October 2023 using the same method; such data are unlikely to exist, which the registration will say. At the third (contemporary data), a later study would be shown beside the claim but not counted, so the registration will say plainly that the claim covers 2022 to 2023. If wanted later, the 2020 study could be registered too, so that the record holds both findings with a declared relation between them; its data were never shared, so its test would face the problems that stopped Scheibehenne.

## Points to settle in drafting

- How the registration states the claim's reach (the operator, 24 October 2026): it concerns information transfer in a one-way story-retelling task, under laboratory conditions, at three sites, in 2022 to 2023. Nothing Calopteryx writes is to present it as a test of the double empathy account or of cross-neurotype communication in general, and the authors' own caution about real-world conversation is to be carried with it.

- How the test treats a finding of no difference: what result would count against it (for example, a significant effect of mixed chains, or of their interaction with position, in either story, under the authors' model and threshold), and whether to use the Bayes factors at all, given that they vary between runs.
- Whether the test covers both stories (the sentence does not distinguish them), and how the unpredicted autistic-chain interaction is described so that it is neither hidden nor overstated.
- Which of the authors' scripts is the analysis of record (with or without covariates), read before drafting.
- How the paper's comparison of chain types handles mixed against autistic chains as well as mixed against non-autistic chains.

## Plan, in order

1. Read the authors' analysis scripts and data dictionary (column names only; no data values), and the Supplementary Information on the models.
2. Draft the registration (claim.external): the exact quotation, the source, the scope (adults recruited August 2022 to October 2023 at three sites), the data of record by fingerprint, and the test.
3. Take it through the checks: the platform's rules, the private rehearsal, the check for private details, the general review and the sign-off summary, then the operator's approval and instruction to send.

Already known: the published figures, the 2020 study they replicate, and the authors' own account of why the results differ ("enhanced participant heterogeneity and methodological differences").
