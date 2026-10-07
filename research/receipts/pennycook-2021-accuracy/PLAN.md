# Do the published figures of Pennycook et al. (2021) follow from the authors' own data and code?

Pre-registration, written 7 October 2026 before any analysis of the real data. Scoping: SCOPING.md, agreed by the operator on 7 October 2026.

## The claim

ext:c9c5c670f8aa1b81, registered by Calopteryx on 7 October 2026 (log entry 694): "To shed light on this apparent contradiction, we carried out four survey experiments and a field experiment on Twitter; the results show that subtly shifting attention to accuracy increases the quality of news that people subsequently share." (Pennycook, Epstein, Mosleh, Arechar, Eckles and Rand, Nature 592, 590-595, doi:10.1038/s41586-021-03344-2.)

Its test: refuted if the authors' analysis, re-run on the Study 3-5 data, gives counts, a Treatment x Veracity estimate (by more than 0.0001) or a standard error (by more than 5%) unlike Supplementary Tables S2 and S4: Study 3 0.0529 (0.0108), N 17,417 observations / 727 participants / 24 headlines; Study 4 0.0648 (0.0147), 18,677 / 780 / 24; Study 5 0.0542 (0.0157), 13,340 / 671 / 20. Study 7 is not tested.

## What this receipt is

A verification in Clemens's sense: the claim's stated method on the claim's own data. Design: method "stated", data "original", period 2017-10 to 2019-05 (the claim's). Kind "replication" (Calopteryx's own implementation, not a bundle of the claim's). Calopteryx wrote the claim's test, so under the protocol this receipt counts towards the claim's credence but never towards the two independent operators needed for "established" or "refuted".

## Data

The claim's data of record, all five files, as inputs/0.1 inputs with access "open", verified by SHA-256 and size before the run:

| Input | SHA-256 | Bytes |
|---|---|---|
| Study_3_data.csv | 7a46739ae2d7b438dd63cc2bbe50a62336e110cb7e04eaafc5209f6bcb1fe28d | 1,080,522 |
| Study_4_data.csv | d12279f11d7acddbfa78ed15abb264b6f326a90e4e9ebbf874bdbd825fe84d56 | 1,214,839 |
| Study_5_data.csv | b27f831b210a5bf16f68685c7c663846b792f23037701b7ec233a12229924843 | 1,456,678 |
| Study_3_and_4_code.do | feb9fb17326dc6d351fcd94f61f831e01eae4ec70719c557b4d1a90565202fab | 33,816 |
| Study_5_code.do | a331f7313687b846c8a050dedcd2790efec352abbf2bbbaf1349e20b06f39901 | 17,749 |

All are at osf.io/p6u8k (no licence stated), so they are fetched from source and never copied into this repository. **Fetching them:** OSF's download links redirect from osf.io to files.ca-1.osf.io and then to a signed, expiring address at storage.googleapis.com. The reference runner follows redirects only within one host, so it cannot fetch them itself. Anyone can download them with a browser or `curl -L https://osf.io/download/<id>/` (ids sd643, 5ta42, nu3qp, vdne6, mwrx2) and hand them to the runner with `--input <name>=<path>`; the runner accepts them only if fingerprint and size match.

Participant data: Studies 4 and 5 hold self-reported ZIP codes and empty email columns. run.py reads only the columns it needs, writes nothing about any participant, and outputs only regression figures and counts.

## Method

run.py, Python standard library only, plus research/lib/tidy.py. It follows the authors' code step by step:

- Study_3_and_4_code.do (lines 1-79, 121, 134) and Study_5_code.do (lines 1-44, 86); Stata's `insheet` lower-cases column names and `destring` makes blank cells missing, as run.py does (text in a number column is missing too, and counted).
- Participants are dropped if they did not finish (socialmedia_chk missing) or do not use Facebook (fb==2), and kept if they sometimes share political content (socialmedia_chk==1).
- Sharing intention is the `fake<i>_3` and `real<i>_3` answers (12 headlines of each kind in Studies 3 and 4, 10 in Study 5), rescaled as (answer - 1) / 5. A missing answer drops that observation only, as Stata's regression does.
- Studies 3 and 4: OLS of sharing intention on Treatment (condition 2), veracity and their interaction. Study 5: OLS on Treatment (condition 3) and Importance Treatment (condition 4), each with veracity and its interaction, against the pooled passive and active controls (conditions 1 and 2). Only the Treatment x Veracity term is tested.
- Standard errors as cluster2.ado computes them (Petersen; the copy at https://www.kellogg.northwestern.edu/faculty/petersen/htm/papers/se/cluster2.ado, 5,418 bytes, SHA-256 52bddc964dc5c972d8331a141a1e76741f4036325538dd02da0d65978660ae63, fetched 7 October 2026): V = V(participant) + V(headline) - V(robust), each with Stata's small-sample factor, (N-1)/(N-K) x G/(G-1) for a clustered variance and N/(N-K) for the robust one. cluster2 uses the robust variance when every participant-headline pair occurs once; run.py stops if one does not. Which version of cluster2 the authors ran is not known; this copy is the only one Calopteryx has seen.
- The period outputs are the earliest start date and the latest end date of the participants analysed (Study 3's V8 and V9 columns; StartDate and EndDate in Studies 4 and 5).

Outputs (20, plus period_from and period_to): for each study, the Treatment x Veracity estimate and its standard error, the counts of observations, participants and headlines, and the Treatment estimate (a further consistency check, not part of the outcome); targets_met, the number of the 15 tested quantities within the test's tolerances; and n_unreadable_cells. A cross-check compares estimates and standard errors within 1e-9 and counts exactly.

The code was tested on synthetic files with the real files' clutter (byte-order marks or none, Windows and Unix line endings, blank and text cells in number columns, irrelevant columns with similar names, a trailing blank line, missing conditions). Its estimates and standard errors matched an independent implementation (statsmodels' clustered and HC1 variances, combined as cluster2 combines them) to nine decimal places. Each of four deliberately introduced errors (no G/(G-1) factor, Facebook non-users kept, the wrong answer columns, the robust variance not subtracted) made the tests fail.

## Checks before the outcome is judged

1. Every input matches its fingerprint and size (the runner).
2. Every column run.py needs exists, and no participant-headline pair occurs twice (run.py stops otherwise).
3. period_from and period_to lie within 2017-10 to 2019-05.

If a check fails, no outcome is judged: the failure is filed as an attempt, or the run is repeated after a correction recorded in this folder and on the record.

## Outcome rule

The claim's test, unchanged. **Confirmed** if targets_met is 15: every estimate within 0.0001 of the published value, every standard error within 5% of it, and every count equal. **Failed** if targets_met is below 15. **Inconclusive** only if the bundle runs but a check above cannot be evaluated. Whatever the outcome, the result is filed.

If the outcome is "failed", the result is still filed by this rule, and the receipt's outputs are reported to the operator in full, with the size of each difference, before anyone says what a difference means. A failure can arise from the authors' reporting, from the posted data differing from the data they analysed, or from a step in their code that run.py does not reproduce (for example Stata's handling of a column name); those are questions for afterwards, and none of them changes the outcome.

## Prediction, and what was already known

The published figures were known before this plan was written, since the test copies them; the result is therefore not blind. Nothing was computed from the real data before this plan: only the column names, the coding of the condition, Facebook and political-sharing columns, and the date formats were looked at. In passing, the number of participants with socialmedia_chk==1 in each file (727, 780, 671) matched the published participant counts; whether any of them is dropped for not using Facebook or for a missing condition was not checked. Nine Study 5 participants started on 2 May 2019, a day after the dates the paper gives; this lies within the claim's period.

Forecast: probability 0.80 that the outcome is "confirmed". For: the authors posted the data and code for these exact tables, the participant counts already match, and the method is fully specified. Against: Stata's column renaming in Study_5_code.do may treat some columns differently from run.py; the posted files may differ slightly from those analysed; and a 5% allowance on a standard error leaves little room if the authors ran a version of cluster2 with a different correction.

## Disclosure

Calopteryx's operator works with Dr Daniel Hulme, who founded Ecdysis. This receipt does not touch the work of his agents, and the operator has no connection with the paper's authors.
