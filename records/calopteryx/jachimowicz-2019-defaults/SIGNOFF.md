# Sign-off: jachimowicz-2019-defaults

Item fingerprint: a1fa471a0d1a559d91a2b85f3cb9839ac065417cfcba498297d9fe90ead4e357
(The approval command shows the start of this fingerprint; approve only if they match.)

## 1. What is being filed, and what it says

This puts on the record the central finding of Jachimowicz, Duncan, Weber and Johnson (2019), the standard estimate of how strongly defaults (the option that applies unless a person changes it) shape choices. Pooling 58 results from 35 articles, the paper finds a considerable effect (d = 0.68, a medium-sized effect by the usual conventions, with a 95% confidence interval of 0.53 to 0.83) and very large differences between studies.

The test is Calopteryx's, and it is a reproduction check. If anyone re-runs the authors' own model on the authors' own posted data and does not get 58 results, an average of 0.68 with an interval of 0.53 to 0.83, and the paper's measure of variation between studies (I² = 98.21%, which says that almost all of the spread between studies is genuine, with very little due to chance), the claim counts as refuted. A run that crashes or gives no number counts as inconclusive, never as a refutation. The sentence also says that "several" studies found no significant effect and "two" found negative ones; the paper gives no rule for counting these, so the test leaves them out and says so.

It is worth filing because defaults are the best-known tool of choice architecture, used in pensions, organ donation, energy tariffs and online retail, and the paper's figure is widely relied on. It also sits beside our Mertens registration, which reports a similar figure for defaults (0.62), so the two can later be linked.

The exact content, as it will be signed (claim.external):

- **source**: doi:10.1017/bpp.2018.43
- **quote**: While our analysis reveals a considerable influence of defaults (d = 0.68, 95% confidence interval = 0.53–0.83), we also discover substantial variation: the majority of default studies find positive effects, but several do not find a significant effect, and two even demonstrate negative effects.
- **test**: Refuted if the paper's base model in DefaultMetaAnalysisandPlots.Rmd, metafor::rma(Cohens_D, Variance_D, test = "t", data = defaultmetafull) (REML, metafor's default), fitted on all rows of defaultmetadata.csv, has k ≠ 58, or if its estimate or 95% CI limits, rounded half away from zero to two decimals, differ from 0.68 [0.53, 0.83], or its I², rounded half away from zero to two decimals, differs from 98.21% (p. 168). Inconclusive if the run stops, times out or does not converge, or gives no finite value for a compared figure.
- **kind**: empirical
- **scope**: 
  - period: from: 1993-01; to: 2017-05
  - basis: Methods (p. 163): "we include studies regardless of their publication date"; "Our search concluded in May 2017". No earliest cutoff exists: 1993-01 marks only the earliest Year (1993) among the 58 included observations, from 55 studies in 35 articles, as the posted data record them; it is no study or eligibility date.
- **fidelity**: as: adapted; basis: The paper's own model and data; ours is the rule: its printed figures must be reproduced, with 'substantial variation' read as the base model's I² of 98.21% (p. 168). The sentence's counts ('several' non-significant, 'two' negative) are not tested, as the paper gives no rule for them. A computational check with known targets; it tests no new sample.
- **data**: 
  - name: defaultmetadata.csv; url: https://osf.io/download/hz56s/; sha256: 23dea101d7440c084601f3c93c597ff152903569dd0f2bd79dc12c5192e9a649; bytes: 14317; access: open
  - name: DefaultMetaAnalysisandPlots.Rmd; url: https://osf.io/download/e58sh/; sha256: 607e9fe2bf16425b780bb1a0e884e5d753ef45df47a88335544b1fa14a35fc1f; bytes: 7912; access: open

## 2. What could be wrong with it

Two rounds of the general review (GPT-6.1 Sol, $0.04 in all) found nothing blocking. Round 1's one clear error (the explanation of the start date could be read as a cut-off) was fixed. What remains is one judgement call, the same one you answered for Pennycook and Mertens, and one minor point that the platform's date format does not let us fix further. I recommend filing as it stands.

### [G1] MAJOR (judgement call), from OpenAI GPT-6.1 Sol

The numerical reproduction is a legitimate test, and its limitations are substantially disclosed, but its outcome is still called a refutation of a broader external claim. Failure to reproduce one rounded figure would establish a discrepancy between the posted materials and the publication, not necessarily refute a considerable default effect or substantial variation. Conversely, reproducing the figures would not verify the quoted assertions about positive, nonsignificant, and negative effects. Adding I² as a required target also makes a figure outside the quotation decisive. The sign-off explanation does not resolve this mismatch in what the filed outcome would mean.

The reviewer suggests: Make the registered proposition explicitly about computational reproducibility: the specified posted dataset and model reproduce k, the pooled estimate, its interval, and I² to the stated precision. Label outcomes as reproduced/not reproduced, or explicitly limit any supported/refuted label to that proposition. Retain the quotation as the source claim, with its untested components clearly separated from the registered proposition.

**Response:** Accepted as it stands, for the reasons you gave for Pennycook on 7 October 2026 and Mertens on 8 October 2026. (1) On Ecdysis, re-running a paper's stated method on its own data is a verification, one of the kinds of check that count as evidence on the claim; the separate "reproducibility claim" the reviewer asks for is not part of the platform's model. (2) If the authors' own data and model do not give their printed figures, the evidence the paper offers for its sentence is weakened, so counting that against the claim is fair; figures are compared only to the two decimals printed, so a false alarm from a tiny difference is unlikely, and the model's settings mean the same in every version of the software since 2016 (checked in its source code). (3) On I²: the paper itself measures "substantial variation" by this figure for this same model (p. 168), so using it is how the test covers the second half of the sentence; leaving it out would leave that half untested. (4) The narrowing is stated openly in the fidelity note, which the platform shows beside the test: the rule is ours, the counts are untested, no new sample is tested. What remains true in the objection: a match would show only that the published figures follow from the published data, and would say nothing about publication bias or whether defaults work in new settings. As you directed for Mertens, any result will be described in exactly those terms.

On the minor point [G2]: the platform requires a start date as a year and month, so a month has to be given; the basis, shown beside it, says that January 1993 marks only the earliest publication year among the included studies and is no cut-off.


Minor points, for information:

- [G2] The structured period begins at 1993-01, although the evidence establishes only an earliest recorded publication year of 1993. January is invented precision, and the basis expressly says this is not an eligibility or study-period boundary. The explanation mitigates the problem for a human reader but leaves the machine-readable period describing a different kind of scope.

## Dr Hulme's agents

Dr Hulme's agents on the record when this was rehearsed (operator op_225d348d88e2d6b727580ffc): Exuvia, Imago. This item does not touch their work.

## 3. What was already known

The published figures themselves, which are the test's targets, so any check is a check against known numbers. The paper's own analysis of publication bias (p. 166) suggests that, if anything, studies with larger effects are missing, which would raise the estimate (to 0.80), though its formal test for bias is not significant. Mertens et al. (2022) report a similar figure for defaults over a larger set of studies (0.62, interval 0.52 to 0.73). Calopteryx has read only the data's year and grouping columns (to state the period and confirm 58 results from 55 studies in 35 articles) and the authors' script; it has not run the model or looked at any effect size, so the test was written without knowing whether it will pass. Nothing on the record concerns defaults (the full public log was searched on 22 October 2026). You confirmed on 8 October 2026 that you have no connection with the authors.

## 4. What happens once it is filed

The paper's claim goes on the public record permanently under an id made from its source and quote, at a neutral prior. Ecdysis's quote scout checks the quote against the source's published text and shows what it found. Others may then test it; the test written here is shown as Calopteryx's.
