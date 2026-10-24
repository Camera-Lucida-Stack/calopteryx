# Sign-off: crompton-2025-information-transfer

Item fingerprint: 7d8bee8a6163e8a6237a7a4200e2ab82021829f9d349ee23e555141d791d78f7
(The approval command shows the start of this fingerprint; approve only if they match.)

## 1. What is being filed, and what it says

This registers one finding from Crompton et al. (2025, Nature Human Behaviour), a Registered Report whose plan the journal accepted before any data were collected. 311 adults, autistic and non-autistic, passed a fictional and a factual story along chains of up to six people: all-autistic chains, all non-autistic chains, and mixed chains. The registered sentence, quoted exactly from the abstract, is: "We found no difference in information transfer between single-neurotype and mixed-neurotype chains."

It is worth filing because the 2020 study it replicates is widely cited, and this larger study did not find the 2020 study's difference for mixed chains. The registration states precisely what was tested: a one-way story-retelling task, in laboratories at Edinburgh, Nottingham and Dallas, with participants recruited between August 2022 and October 2023. It says plainly that this is not a test of everyday conversation or of the double empathy account.

The test, in plain words: re-run the authors' own model on their published data. Compare mixed chains with non-autistic chains and with autistic chains, in each story, looking at both how much detail they keep and how fast they lose it. If any of those four comparisons shows a significant difference, after the usual correction for making several comparisons, the sentence counts as refuted. If the re-run fails to reproduce the paper's printed figures, or the model cannot be fitted reliably, the result is inconclusive. A new study from the same period can refute the claim; if it is smaller than this one and finds no difference, it is inconclusive. A result that is not refuted means only that no difference was detected, not that the chains are the same.

The exact content, as it will be signed (claim.external):

- **source**: doi:10.1038/s41562-025-02163-z
- **quote**: We found no difference in information transfer between single-neurotype and mixed-neurotype chains.
- **test**: Per story, the authors' model (lmer(score ~ chain_type * log(order) + site * info * first + (1 + log(order) | number)), Satterthwaite): refuted if any of four joint F-tests (level and slope) of mixed against non-autistic or autistic chains has Holm-adjusted p < .05. Inconclusive if a run errs, no allFit optimizer converges, or, on the original data, it misses (two decimals, halves away from zero): log(order) −5.29 (fictional), −4.57 (factual), fictional autistic × log(order) −1.73 (SE 0.83). New data (2022-08 to 2023-10; same task, stories, scoring): under 54 chains, only a refutation counts.
- **kind**: empirical
- **scope**: 
  - period: from: 2022-08; to: 2023-10
  - basis: Methods, 'Timeline': "Participants were recruited between August 2022 and October 2023." 311 adults (154 autistic, 157 non-autistic) in 54 diffusion chains at Edinburgh, Nottingham and Dallas, passing on one fictional and one factual story in a one-way retelling task.
- **fidelity**: as: adapted; basis: The authors' models, data and threshold. Ours, set after reading the published results: joint tests of mixed against each single-neurotype group (the authors never compared mixed with autistic), Holm over four, printed figures checking the re-run, the 54-chain rule. Not refuted means no difference detected. No Bayes factors. A one-way retelling task: not everyday conversation or double empathy.
- **data**: 
  - name: DISI_Core_Dataset.csv; url: https://osf.io/download/5nwq2/; sha256: 846b9cd79764c198a5e008155cb1c9d02b008394f3452e0ac7d6a9c0a63fda0f; bytes: 82692; access: open
  - name: DISI_InfoTransfer_NoCovariates.Rmd; url: https://osf.io/download/52y8p/; sha256: 71446e02566b273c75ffb7e2a708e84b2379aafdd08b0a36b2024e0f7c842e5c; bytes: 25032; access: open

## 2. What could be wrong with it

Four review rounds by GPT-6.1 Sol (about $0.14 in all; the third and fourth were recorded departures from the playbook, agreed with Lucy, because the test changed). Round 1's blocking point (printed figures unrelated to the sentence could refute it) and round 2's (the test left out the comparison with autistic chains, which the sentence covers) were both fixed. Rounds 3 and 4 found nothing blocking. What remains is about how a future re-run should be carried out, and about the word "refuted", which is Ecdysis's fixed vocabulary for a test that goes against a claim.

### [G1] MAJOR (judgement call), from OpenAI GPT-6.1 Sol

The decision rule changes the meaning of the quoted historical report. Detecting a difference with newly chosen joint contrasts does not establish that the authors failed to find what they reported using their own analyses. This is especially important for mixed-versus-autistic comparisons, which the context says the authors did not perform. The context acknowledges this distinction, but the filed item's unqualified outcome label remains 'refuted'.

The reviewer suggests: Make the distinction explicit in the filed item and eventual outcome: an exploratory reanalysis detected a difference under an adapted test, rather than failed to reproduce the authors' reported tests. Keep reproduction of published results, additional contrasts, and independent replication as separate conclusions.

**Response:** Accepted as it stands, as Lucy has answered for earlier registrations. On Ecdysis, a check that goes against a claim is labelled "refuted"; we cannot choose another label. The sentence says there was no difference, so evidence of a difference counts against it, and that is why Lucy decided to include the comparison with autistic chains. The filed fidelity note says the joint tests and that comparison are ours, not the authors', and our notes say that a significant result would not mean the authors' own analysis was reproduced wrongly.

### [G2] MAJOR (clear error), from OpenAI GPT-6.1 Sol

The filed item discloses that the test was chosen after reading the results, but does not carry over the context's essential qualification that Holm-adjusted p < .05 is not a confirmatory 5% error guarantee here. Holm controls multiplicity for a fixed family; it does not account for choosing the family, contrasts, and decision rule using information from the same data. A reader of the permanent item could mistake the adjustment for protection against that selection.

The reviewer suggests: Put the exploratory status and lack of a confirmatory error-rate guarantee directly in the filed item and receipt. Report the adjusted p-values without presenting them as selection-adjusted evidence. Reserve confirmatory significance claims for an independently registered analysis on eligible independent data.

**Response:** Accepted as it stands. The filed note says the test was "set after reading the published results", which is the substance of the point; Ecdysis allows 400 characters, and there is no room for more. Our notes carry the full qualification (the 5% figure is not a confirmatory error rate here), and any re-run Calopteryx files would say so in its methods.

### [G3] MAJOR (judgement call), from OpenAI GPT-6.1 Sol

Choosing the first warning-free allFit result establishes neither agreement among optimizers nor that the selected fit is the best solution found. A converged result can have a worse objective value or materially different fixed effects and covariance estimates than other converged results. The limited printed-coefficient checks do not protect the decisive mixed-chain contrasts against this problem.

The reviewer suggests: Freeze an objective-based acceptance rule before execution. Compare objective values, fixed effects, covariance estimates, and decisive contrasts across converged fits; investigate materially different solutions using stricter tolerances or additional starts. Treat unresolved numerical disagreement as inconclusive rather than selecting by optimizer order.

**Response:** Done, in our notes, which govern how a re-run is carried out. If the default fit fails to converge, every alternative setting is tried; the converged fit with the best value of the model's own criterion is used, and if the converged fits disagree about the outcome, the result is inconclusive. Further detail (tolerances, extra starting values) belongs to the re-run's own plan, fixed before it runs.

### [G4] MAJOR (judgement call), from OpenAI GPT-6.1 Sol

Eligibility for new data is still under-specified. Matching the period, stories, scoring, and chain design does not identify the participant population, diagnostic eligibility, recruitment setting, chain-composition rules, exclusions, or treatment of incomplete chains. Those differences can change the estimand and the suitability of the stated site and other model terms. 'Same task' is insufficient to distinguish a replication from an extension consistently.

The reviewer suggests: Specify the population and design eligibility rules, allowable departures, missingness and exclusion rules, and how the formula applies to each eligible dataset. Define independence from the original sample and apply these rules before seeing candidate datasets' results.

**Response:** Accepted as it stands. Data from this exact period and design almost certainly do not exist; the test names the period, task, stories and scoring, and our notes add the chain design and independence from this sample. Anything else counts as an extension on Ecdysis, shown beside the claim but not counted. A full eligibility protocol belongs to whoever proposes such a study, before they look at its results.


Minor points, for information:

- [G5] The 54-chain boundary creates different outcome labels for otherwise similar nonsignificant studies without an evidential justification. The context correctly admits that 54 chains provides no assurance of adequate power, but that admission does not explain why reaching this number should change 'inconclusive' to 'not refuted'. Chain counts also ignore completeness, imbalance, and within-chain information.
- [G6] The fallback acceptance rule is internally ambiguous: singularity can generate a boundary/singular-fit message, yet the rule both requires warning-free convergence and says singularity does not disqualify a fit. In addition, singularity is not limited to a variance estimated at zero; a random-intercept/random-slope covariance matrix can be rank-deficient through a correlation at the boundary.
- [G7] The item names DISI_InfoTransfer_NoCovariates.Rmd, whereas the context identifies DISI_InformationTransfer_Analysis_NoCovariates.Rmd as the source of fi2 and fa2. The URL and hash may resolve the identity, but the inconsistent filenames leave an avoidable ambiguity about which artifact supplied the model.

On the minor points: G5, the 54-chain floor is a plain convention, and our notes say that reaching it gives no assurance of adequate power; G6, the convergence and singularity rules in our notes were corrected after this round; G7, our notes now say that the short file name in the data list is the authors' script, identified by its address and fingerprint (Ecdysis limits data names to 40 characters).

## Dr Hulme's agents

Dr Hulme's agents on the record when this was rehearsed (operator op_225d348d88e2d6b727580ffc): Exuvia, Imago. This item does not touch their work.

## 3. What was already known

The test is not blind to the published results, and says so. Before writing it, we had read the paper's results: how fast detail was lost in each story, the one unexpected result (in the fictional story, autistic chains lost detail slightly faster than non-autistic ones), and the authors' statement that no other difference between chain types was significant. The figures for mixed chains themselves are printed neither in the paper nor in its supplement, and we have not seen them: we read only the data file's column names and its data dictionary, and ran no model.

Also known: the 2020 study (72 participants) found that detail declined faster in mixed chains; the authors suggest that more varied participants and differences of method may explain why this study did not. Their own conclusion cautions that a one-way retelling task may not capture difficulties in real two-way conversation. Nothing on Ecdysis concerns this topic, and Lucy has no connection with the authors.

## 4. What happens once it is filed

The paper's claim goes on the public record permanently under an id made from its source and quote, at a neutral prior. Ecdysis's quote scout checks the quote against the source's published text and shows what it found. Others may then test it; the test written here is shown as Calopteryx's.
