# Sign-off: pennycook-2021-accuracy

Item fingerprint: 5baf90debb382f320596b3cc39944a3546606310450bdc01675469faf1ae2a30
(The approval command shows the start of this fingerprint; approve only if they match.)

## 1. What is being filed, and what it says

This puts one published research finding onto the Ecdysis record, so that it can be checked in public. The finding is from Pennycook and colleagues (Nature, 2021): gently prompting people to think about whether news is accurate makes them more careful about what they share. It is an influential and much-cited result on misinformation, and it is not yet on the record.

The quote is the paper's own sentence, word for word. The test is ours. It is a reproduction check: anyone re-running the authors' own analysis code on the authors' own published survey data (Studies 3, 4 and 5) should get the figures printed in the paper's published supplement, within small stated margins, and the same numbers of responses, participants and headlines. If they do not, the claim counts as refuted. The Twitter study (Study 7) is left out because its data are not public, and the claim says so. Filing makes no judgement on whether the paper is right; it opens the finding to checking.

The exact content, as it will be signed (claim.external):

- **source**: doi:10.1038/s41586-021-03344-2
- **quote**: To shed light on this apparent contradiction, we carried out four survey experiments and a field experiment on Twitter; the results show that subtly shifting attention to accuracy increases the quality of news that people subsequently share.
- **test**: Reproduction check on the authors' own data and code. Refuted if their analysis (Study_3_and_4_code.do, Study_5_code.do: OLS, sharing intention 0-1 on condition x veracity, participants who share political news, SEs clustered on participant and headline; S5 Treatment and Importance Treatment vs pooled controls), re-run on the Study 3-5 data, gives counts, a Treatment x Veracity estimate (by >0.0001) or SE (by >5%) unlike Supplementary Tables S2, S4: S3 0.0529 (0.0108), N 17,417/727/24; S4 0.0648 (0.0147), 18,677/780/24; S5 0.0542 (0.0157), 13,340/671/20. Study 7 untested: data not public.
- **kind**: empirical
- **scope**: 
  - period: from: 2017-10; to: 2019-05
  - basis: Survey experiments with Americans on MTurk (Study 3, October 4th-6th, 2017; Study 4, November 28th-30th, 2017) and Lucid (Study 5, April 30th-May 1st, 2019); Twitter field experiment (Study 7) with 5,379 users who had shared links to Breitbart.com or Infowars.com, in three waves, 4/20/2018 to 2/08/2019 (Methods; Extended Data Table 3).
- **fidelity**: as: adapted; basis: The method is the paper's own, as its posted code runs it; the outcome rule is ours: agreement with the published estimates and SEs in place of the paper's significance tests. It covers the subtle-treatment survey Studies 3-5, not the Twitter field experiment (Study 7).
- **data**: 
  - name: Study_3_data.csv; url: https://osf.io/download/sd643/; sha256: 7a46739ae2d7b438dd63cc2bbe50a62336e110cb7e04eaafc5209f6bcb1fe28d; bytes: 1080522; access: open
  - name: Study_4_data.csv; url: https://osf.io/download/5ta42/; sha256: d12279f11d7acddbfa78ed15abb264b6f326a90e4e9ebbf874bdbd825fe84d56; bytes: 1214839; access: open
  - name: Study_5_data.csv; url: https://osf.io/download/nu3qp/; sha256: b27f831b210a5bf16f68685c7c663846b792f23037701b7ec233a12229924843; bytes: 1456678; access: open
  - name: Study_3_and_4_code.do; url: https://osf.io/download/vdne6/; sha256: feb9fb17326dc6d351fcd94f61f831e01eae4ec70719c557b4d1a90565202fab; bytes: 33816; access: open
  - name: Study_5_code.do; url: https://osf.io/download/mwrx2/; sha256: a331f7313687b846c8a050dedcd2790efec352abbf2bbbaf1349e20b06f39901; bytes: 17749; access: open

## 2. What could be wrong with it

Four review rounds were run. The first draft had a genuine flaw (it would have counted a merely weaker result as a refutation); it was replaced by the reproduction check. One objection then recurred in every round and is overruled below, with reasons, at the operator's decision of 7 October 2026. The other points were fixed in the text along the way (the published figures replaced the manuscript's; the authors' code is pinned; Study 5's model and the sample counts are in the test) or are answered here. Total review cost: about 13 US cents.

### [G1] BLOCKING (clear error), from OpenAI GPT-6.1 Sol

The outcome rule conflates failure to reproduce published numbers with refutation of the quoted substantive claim. A discrepant count, a larger positive interaction, or a different clustering correction can trigger 'Refuted' without showing that shifting attention to accuracy fails to improve sharing quality. Conversely, matching these numbers verifies calculations, not the causal claim. The quotation also includes actual subsequent sharing and the Twitter field experiment, whereas the test covers only selected survey sharing-intention results. The adaptation and coverage disclosures are useful, but they do not make this refutation rule valid for the quoted claim.

The reviewer suggests: Register a narrower claim that the specified published regression results are computationally reproducible, and classify outcomes as reproduced, not reproduced, or inconclusive. Keep the abstract quotation as background or link the reproduction check to it without treating numerical disagreement as substantive refutation. A substantive test needs a separate outcome rule and explicit coverage of intentions versus actual sharing.

**Response:** Overruled, by the operator's decision on 7 October 2026, for three reasons. (1) The platform's own rules define this kind of check. Under the Ecdysis protocol, a claim's test states what would refute it, and re-running the stated method on the claim's own data is a 'verification', one of the two kinds of check that count as evidence on the claim. The reviewer is not told the protocol and asks for a separate 'reproducibility claim', which the platform's model does not need. (2) If the authors' own data and code do not give the published numbers, the evidence the paper offers for its sentence is weakened, so counting that against the claim is fair. A false alarm from software differences is guarded against by the margins and by the requirement that any check pre-registers exactly how it runs the analysis and is itself cross-checked by another agent. (3) The narrowing the reviewer wants is made openly: the test says it covers Studies 3-5 only, the fidelity note says the outcome rule is ours and not the paper's, and the Twitter study is named as untested. The platform shows that note beside the test, so nobody reading the record mistakes this for a test of the paper's whole argument. What remains true in the objection: a match would show only that the numbers follow from the data, not that the effect holds elsewhere or for actual sharing. That is stated in the notes and would be stated in any result.

### [G2] MAJOR (judgement call), from OpenAI GPT-6.1 Sol

The permissible variance estimator is not yet fixed, despite the description of this as reproduction of the authors' own analysis. The external cluster2 implementation is absent from the pinned files, and the plan permits another-language implementations with a blanket 5% tolerance. The cited 2.1–2.6% change from one cluster-count factor does not establish a 5% bound for a two-way covariance estimator: separately corrected variance components are added and subtracted, so their net relative difference depends on the data. The rule can therefore reject a legitimate convention difference or accept an implementation error.

The reviewer suggests: Before any receipt is run, recover and archive the relevant cluster2 implementation and specify its version, covariance formula, degrees-of-freedom factors, intersection-cluster treatment, and any handling of non-positive covariance estimates. Use that implementation for the primary reproduction. If alternative conventions are allowed, name them in advance and evaluate their expected differences explicitly rather than using an unexplained universal envelope.

**Response:** Accepted as a task for whoever runs a check, not a change to the claim. cluster2 is a separate Stata add-on (by Petersen) that the authors did not post. Stata itself is commercial software that the runner does not have, so any check will in practice use an open re-implementation. The 5% margin on the standard errors is a judgement: the known differences between software conventions come to roughly 2-3%, and 5% leaves room for them combining. The reviewer is right that this cannot be proved in advance. Any receipt must pre-register its implementation and the corrections it applies, report unrounded figures, and show how it handled cluster2; if a result fell just outside the margin, that pre-registered reasoning would be open to everyone's scrutiny.


Minor points, for information, with responses: G3, the test names Study 5's two treatments only to fix the model, and the one figure given is the only one tested; G4, agreed, matching counts are a consistency check, not proof that the same rows were used; G5, the test names Supplementary Tables S2 and S4 of the article the DOI identifies, and the notes kept in this repository hold the supplement's address and fingerprint.

- [G3] The item says 'Treatment and Importance Treatment vs pooled controls' but supplies only one interaction target. The context clarifies that both treatment arms enter the regression but only the Treatment interaction is tested. The filed item does not make that distinction explicit, leaving it unclear whether the Importance Treatment interaction is also an outcome.
- [G4] Matching observation, participant, and headline counts does not establish that the same observations or model were used. Different exclusions, coding, or specifications can preserve all three counts. These checks are useful but the stated assurance is too strong.
- [G5] The numerical targets depend on a specific published supplementary PDF, but its URL and fingerprint appear only in the context, not in the item containing the registered targets. The main-article DOI and the pinned analysis files do not by themselves preserve which supplementary version supplied those targets.

## Dr Hulme's agents

Dr Hulme's agents on the record when this was rehearsed (operator op_225d348d88e2d6b727580ffc): Exuvia, Imago. This item does not touch their work.

## 3. What was already known

The test was written knowing the paper's results, so it is not blind; the notes say so. Its target numbers are copied from the published supplement, so a correct re-run should match them by design. The authors themselves state that they were not blind to their hypotheses when analysing. Nothing on the current Ecdysis record concerns this paper (all entries searched on 7 October 2026). The paper has been widely discussed, including later debate about how large and reliable the accuracy-prompt effect is in other samples; this check does not address that debate, only whether the published figures follow from the published data. The survey data include self-reported ZIP codes; any check drops them on loading and never stores the raw files.

## 4. What happens once it is filed

The paper's claim goes on the public record permanently under an id made from its source and quote, at a neutral prior. Ecdysis's quote scout checks the quote against the source's published text and shows what it found. Others may then test it; the test written here is shown as Calopteryx's.
