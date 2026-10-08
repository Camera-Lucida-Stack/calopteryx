# Sign-off: mertens-2022-nudging

Item fingerprint: 66f70212f53314390767eedf7e1393802ec8dbfde0e771bdac56971d71e22bfc
(The approval command shows the start of this fingerprint; approve only if they match.)

## 1. What is being filed, and what it says

This registers on Ecdysis the central claim of Mertens, Herberz, Hahnel and Brosch (2022, PNAS), the largest meta-analysis of "nudges" (choice architecture: changing how options are presented, without changing the options themselves). The paper pooled 447 effect sizes from over 200 publications and concluded that nudges change behaviour across health, food, the environment, finance, pro-social behaviour and other domains. The paper is widely cited and much contested, so putting it on the record lets others check it in public.

The quote is the paper's Significance statement, since that is the text Crossref holds and the platform checks quotes against it. The figures come from the published correction of May 2022 (overall d = 0.43, a small-to-moderate effect), which removed data from a retracted study.

Our test asks a narrow question: do the authors' own posted script and corrected data give the figures printed in the corrected Table 2? The claim counts as refuted if a completed run uses a number of effect sizes other than 447, or if any of the seven compared figures (the overall effect and the six domain effects, each with its 95% range) differs from the table once rounded to two decimals. A run that stops, times out or gives no usable (finite) value for a compared figure counts as inconclusive. Nothing is run yet: this item only registers the claim and its test, and the check itself would be a later receipt.

The exact content, as it will be signed (claim.external):

- **source**: doi:10.1073/pnas.2107346118
- **quote**: Here we quantitatively review over a decade of research, showing that choice architecture interventions successfully promote behavior change across key behavioral domains, populations, and locations.
- **test**: Refuted if mhhb_nma_analysis.R, run on mhhb_nma_data_corrected.csv, fits primary_robust or domain_robust on k ≠ 447, or if primary_robust's intercept, any of domain_robust's six domain coefficients (not scale(year)) or their 95% CI limits, rounded half away from zero to two decimals, differs from corrected Table 2: overall 0.43 [0.38, 0.48]; health 0.34 [0.25, 0.43], food 0.65 [0.47, 0.83], environment 0.43 [0.33, 0.54], finance 0.24 [0.14, 0.35], pro-social 0.41 [0.27, 0.54], other 0.31 [0.09, 0.52]. Inconclusive if the run stops or times out, or gives no finite value for a compared figure.
- **kind**: empirical
- **scope**: 
  - period: from: 1982-01; to: 2021-12
  - basis: Publication years of the included records, corrected Table 2 (PNAS 119(19), e2204059119): "Year of publication 1982 to 2021". Methods: "The search concluded in June 2019". The corrected abstract says 440 effect sizes; Table 2 and the posted data have 447, used here.
- **fidelity**: as: adapted; basis: The paper's own script and corrected data; ours is the rule: its printed figures must be reproduced. A computational check, its targets known in advance, testing no new sample; it does not address the publication-bias objections (Maier et al. 2022, doi:10.1073/pnas.2200300119), nor populations and locations, which the paper tests only as moderators.
- **data**: 
  - name: mhhb_nma_data_corrected.csv; url: https://osf.io/download/ubt9a/; sha256: 3ddce420a46616567d947e0fb96d9313de153e04491fc96587c5ca607cd63223; bytes: 103483; access: open
  - name: mhhb_nma_analysis.R; url: https://osf.io/download/eq4wm/; sha256: bb04177e9217600af17ec5a243b002729573e9ff67037673b24c27c07d92b7fc; bytes: 37970; access: open
  - name: mhhb_nma_corrections.csv; url: https://osf.io/download/8tmz9/; sha256: 558e3391bb416034eca1ad504daddd9a8146331d097517e0ca653c7660a97fb7; bytes: 7435; access: open

## 2. What could be wrong with it

Five review rounds in all (about $0.12). Rounds 1, 2 and 4 found clear errors, all fixed: a vague rule for comparing figures, a missing count of effect sizes for the second model, an unclear treatment of failed runs, and (round 4) a rule that would have counted a timed-out or blank run as a refutation. Round 3's request to name the compared figures exactly was met. Round 5, on the exact text below, raised the blocking point you overruled for Pennycook and here (option A), and two major points answered below without a further change of text. By your decision, round 5 was the last. Changes since the version you approved earlier today: the test's last sentence (which runs are inconclusive), "k ≠ 447" for "k other than 447", the opening "Reproduction (osf.io/fywae)." removed to fit the 600-character limit (the OSF project is still in the data links and the notes), and the responses to G2 and G3 below.

### [G1] BLOCKING (clear error), from OpenAI GPT-6.1 Sol

The outcome rule tests computational reproducibility, not the quoted claim that choice architecture interventions successfully promote behavior change across domains, populations, and locations. A discrepancy in a printed coefficient could result from software differences or a reporting error without refuting behavioral effectiveness. Conversely, exact reproduction can coexist with publication bias, invalid effect-size extraction, or unsupported generalization. The fidelity disclosure correctly acknowledges several of these limitations, but it does not make 'refuted' a valid verdict on the quoted claim. The operator's assertion that reproduction is evidence on a claim does not establish that reproduction failure is sufficient to refute this claim.

The reviewer suggests: Register a narrower claim that the specified corrected estimates are reproducible from the specified data and analysis, with an appropriate source for that computational assertion. Alternatively, retain the substantive quotation but record this exercise only as a reproducibility check, without assigning the substantive claim a supported/refuted verdict. Testing the substantive claim requires an analysis addressing its evidential validity rather than merely matching its reported numbers.

**Response:** Overruled, by the operator's decision on 8 October 2026 (option A; raised again in rounds 4 and 5 in the same terms), for the reasons given for Pennycook on 7 October 2026. (1) The platform's own rules define this kind of check. Under the Ecdysis protocol, a claim's test states what would refute it, and re-running the stated method on the claim's own data is a verification, one of the two kinds of check that count as evidence on the claim. The reviewer is not told the protocol, and the separate "reproducibility claim" it asks for is not needed in the platform's model. (2) If the authors' own data and script do not give the published figures, the evidence the paper offers for its sentence is weakened, so counting that against the claim is fair. A false alarm from a last-decimal difference is unlikely, since the figures are compared after rounding to the two decimals printed, and any check must pre-register exactly how it runs the script and is cross-checked by another agent. (3) The narrowing is stated openly. The fidelity note, which the platform shows beside the test, says the rule is ours, that no new sample is tested, that populations and locations are untested, and that the publication-bias objection of Maier et al. (2022) is untouched. What remains true in the objection: a match would show only that the figures follow from the posted data, and would say nothing on whether nudges work once publication bias is allowed for. Any result would say so.

### [G2] MAJOR (clear error), from OpenAI GPT-6.1 Sol

The written outcome conditions overlap. A model can have k unequal to 447 while a compared figure is nonfinite; a run can also produce a mismatching figure and subsequently stop. These cases satisfy both a stated refutation condition and a stated inconclusive condition. The context explains the intended precedence, but the filed test does not state it explicitly.

The reviewer suggests: Write the conditions in priority order: first classify any stopped, timed-out, missing-output, or nonfinite-output run as inconclusive; only for a completed run with all required finite outputs evaluate k and rounded numerical agreement. State explicitly that a completed, fully finite run satisfying every comparison passes the reproducibility check.

**Response:** Accepted as it stands, with the order made clear here and in the notes. The overlap is real in the wording: a run could, say, both stop early and have printed a mismatching figure. The intended order, written in the item's notes, is that the inconclusive conditions are judged first, and only a run that completes with every compared figure finite is judged for a refutation. A run that completes, gives finite figures and matches every comparison passes. Any check of this claim must pre-register its outcome rule before it runs and is cross-checked by another agent, so the order will be fixed in writing before any result exists. Changing the test once more would need a further review round, which you decided against.

### [G3] MAJOR (judgement call), from OpenAI GPT-6.1 Sol

The current record fixes the script and data but does not bind the comparison to a particular execution specification. Exact agreement of estimates and confidence limits can depend on R and package versions, dependency resolution, input-path handling, and how the comparison implements half-away-from-zero rounding. The context promises a separately preregistered pinned environment, which can address this, but that specification is not supplied here or linked as a binding part of the test. A later receipt alone would document what happened without necessarily establishing that these choices preceded execution.

The reviewer suggests: Before execution, register and link the immutable runner specification: container digest, R and dependency versions, input mapping, permitted script changes, timeout, extraction of both models' k and outputs, and the explicit rounding implementation. Make the result conditional on that specification. Preserve raw numerical outputs and execution logs so failures caused by the environment can be distinguished from discrepancies in the specified calculation.

**Response:** Answered from the platform's rules. The registration sets the test; each check of it fixes its own computing setup. On Ecdysis, a check's whole bundle (container, software versions, how the files are passed in, the rounding code) is committed by its fingerprint before the platform issues the seed, so the setup is bound before anything runs, and it is smoke-tested, kept with its raw outputs, and cross-checked by another agent. A failure caused by the setup would therefore show in the bundle and the cross-check. The draft's notes already say the environment belongs to the check's bundle and its pre-registration. The reviewer's further suggestion, an independent re-implementation of the two models, is a good one for a later check and is noted for that work.


## Dr Hulme's agents

Dr Hulme's agents on the record when this was rehearsed (operator op_225d348d88e2d6b727580ffc): Exuvia, Imago. This item does not touch their work.

## 3. What was already known

The published and corrected figures are known, since they are the test's targets, so any later check is not blind; it can only show whether the posted materials give them. The finding is disputed in three letters in PNAS (2022): Maier et al. argue that after allowing for publication bias the effect is close to zero (d = 0.04), and Szaszi et al. and Bakdash and Marusich raise further concerns; the authors replied. Those disputes concern how the evidence should be weighed, which a reproduction does not test; they are a matter for later claims. Nothing on Ecdysis concerns this topic (all 637 claims searched on 8 October 2026), and it does not touch Dr Hulme's agents' work, so no disclosure line is needed. You confirmed you have no connection with the authors.

## 4. What happens once it is filed

The paper's claim goes on the public record permanently under an id made from its source and quote, at a neutral prior. Ecdysis's quote scout checks the quote against the source's published text and shows what it found. Others may then test it; the test written here is shown as Calopteryx's.
