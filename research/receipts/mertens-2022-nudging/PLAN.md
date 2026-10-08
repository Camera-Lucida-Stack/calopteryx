# Do the corrected figures of Mertens et al. (2022) follow from the authors' own data and script?

Pre-registration, written 8 October 2026, for the operator's approval with the code. Scoping: SCOPING.md, agreed by the operator on 8 October 2026 with its three recommendations. What had been seen of the real files before this plan is set out under "What was already known"; no analysis of the real data has been run.

## The claim

ext:a6ba607cefd5f903, registered by Calopteryx on 8 October 2026 (log entry 1245): "Here we quantitatively review over a decade of research, showing that choice architecture interventions successfully promote behavior change across key behavioral domains, populations, and locations." (Mertens, Herberz, Hahnel and Brosch, PNAS 119(1), e2107346118, 2022; corrected in PNAS 119(19), e2204059119.)

Its test, unchanged: refuted if mhhb_nma_analysis.R, run on mhhb_nma_data_corrected.csv, fits primary_robust or domain_robust on k ≠ 447, or if primary_robust's intercept, any of domain_robust's six domain coefficients (not scale(year)) or their 95% CI limits, rounded half away from zero to two decimals, differs from corrected Table 2: overall 0.43 [0.38, 0.48]; health 0.34 [0.25, 0.43], food 0.65 [0.47, 0.83], environment 0.43 [0.33, 0.54], finance 0.24 [0.14, 0.35], pro-social 0.41 [0.27, 0.54], other 0.31 [0.09, 0.52]. Inconclusive if the run stops or times out, or gives no finite value for a compared figure.

## What this receipt is

A verification in Clemens's sense: the claim's stated method on the claim's own data. Design: method "stated", data "original", period 1982-01 to 2021-12 (the claim's). Kind "replication": the claim has no bundle of its own, and the wrapper is Calopteryx's, though the analysis it runs is the authors' script itself. Calopteryx wrote the claim's test, so under the protocol this receipt counts towards the claim's credence but never towards the two independent operators the platform needs to call it established or refuted. No earlier receipt of the claim exists, so the seal will assign no cross-check, and nothing here touches the work of Dr Hulme's agents (to be confirmed by the rehearsal before the commitment).

## Data

The claim's data of record, all three files, as inputs/0.1 inputs with access "open", licence "none stated by the authors on OSF; fetched from source, not redistributed", verified by SHA-256 and size before the run:

| Input | SHA-256 | Bytes | Posted on OSF |
|---|---|---|---|
| mhhb_nma_data_corrected.csv | 3ddce420a46616567d947e0fb96d9313de153e04491fc96587c5ca607cd63223 | 103,483 | 27 February 2022 |
| mhhb_nma_analysis.R | bb04177e9217600af17ec5a243b002729573e9ff67037673b24c27c07d92b7fc | 37,970 | 27 February 2022 |
| mhhb_nma_corrections.csv | 558e3391bb416034eca1ad504daddd9a8146331d097517e0ca653c7660a97fb7 | 7,435 | 27 February 2022 |

All are in OSF project fywae. The corrections file is listed because it is part of the data of record; it is never read, since the corrected data already include the corrections. run.R repeats the check of the first two files with MD5 (R 4.1 has no SHA-256 of its own). The data are effect sizes from published studies and hold nothing about any person.

## Software

- **Image:** rocker/tidyverse:4.1.2, pinned as sha256:879098acd5a8277f3c368a1e2c431019d00d952959a588da12cdaaee9d968b8b (image id sha256:23cb60d0…). It holds R 4.1.2 (1 November 2021, current until R 4.1.3 on 10 March 2022), with dplyr 1.0.8, ggplot2 3.3.5 and readr 2.1.2 installed from the CRAN snapshot of 9 March 2022, ten days after the corrected files were posted.
- **metafor 3.0-2,** released on CRAN on 9 June 2021 and current until 3.4-0 on 21 April 2022, so current both when the paper was submitted and when the corrected figures were computed. With the two packages it needs that the image lacks, mathjaxr 1.6-0 (28 February 2022) and pbapply 1.5-0 (16 September 2021), and numDeriv 2016.8-1.1 (6 June 2019, still the current release), which metafor uses only if it is installed and without which the script's selmodel() calls (its publication-bias sensitivity analysis, line 282) stop with an error before the domain model is reached, it is carried in vendor/ exactly as downloaded from CRAN's archive (all GPL, which permits this), and installed into /tmp at the start of each run, since the sealed machine has no network.

| File in vendor/ | SHA-256 |
|---|---|
| metafor_3.0-2.tar.gz | 02df435197b225da736103edf73d19253a542bc31fc0b99610c02daec434138a |
| mathjaxr_1.6-0.tar.gz | ecc47607111b788d84789459af7f4f9102719f98640b7a23bd5a4eb1a6d3c179 |
| pbapply_1.5-0.tar.gz | effdfee286e5ba9534dc2ac3cee96590a37f5cd2af28c836d00c25ca9f070a55 |
| numDeriv_2016.8-1.1.tar.gz | d8c4d19ff9aeb31b0c628bd4a16378e51c1c9a3813b525469a31fe89af00b345 |

**Why these versions, and the alternative.** The authors do not say which versions they used. metafor's cluster-robust adjustment and its fitting have changed between versions, so today's metafor could give slightly different figures for reasons the authors could not have caused. The test asks whether the authors' materials give the authors' figures, so the versions current when the figures were computed are used. If the outcome is "failed", that choice is the first thing to examine, and the operator is told so before anything is read into a difference.

## Method

run.R, run from the checkout's root as `Rscript research/receipts/mertens-2022-nudging/run.R`, does the following and nothing else.

1. Checks the two inputs it uses against their fingerprints, installs the four vendored packages into /tmp and confirms that metafor 3.0-2 loaded.
2. Sets R's random seed from ECDYSIS_SEED (its first seven hexadecimal digits). Nothing in the parts of the script the test uses is random; the seed is set so that, if anything is, it comes from the archive's seed only.
3. Copies the corrected data into a writable folder under /tmp and runs the authors' script there, unchanged, from its first line to its last. The script reads its data by name from the folder it runs in, which is why it runs in a copy of that folder. Two things are changed around it, neither inside it: the script's eight View() calls, which open a spreadsheet window that a sealed machine does not have and would otherwise stop the run, do nothing; and its plots go to no file.
4. If the script stops with an error after both named models exist, the comparison still goes ahead and script_completed is 0; if it stops before then, there is nothing to compare, and run.R writes no outputs.
5. Reads the seven figures from the two named models, finding each row by its coefficient's name (compare.R): primary_robust's intercept ("intrcpt"), and domain_robust's six rows "factor(domain)health", "factor(domain)food", "factor(domain)environment", "factor(domain)finance", "factor(domain)pro-social" and "factor(domain)other" (the data's own labels). The domain model has no intercept and its year term is centred (scale(year)), so each domain row is that domain's estimate at the mean publication year, which is what Table 2 reports; the year coefficient is not compared. A missing name stops the run with no outputs.
6. Rounds each estimate and each 95% CI limit half away from zero to two decimals (R's own round() rounds half to even, so it is not used) and compares the 21 numbers with Table 2, as compare.R does.

**Outputs** (18, plus period_from and period_to): k_primary and k_domain; for each of the seven figures, est_<figure> and hw_<figure> (the half-width of its 95% interval: robust() gives the estimate plus or minus t times its standard error, so the interval is symmetric and is recovered exactly from the two); mismatches (how many of the 21 compared numbers differ after rounding); and script_completed (1 if the script ran to its last line). The full report of 7 estimates, 14 limits and 2 counts would be 23 numbers, above the platform's limit of 20, which is why half-widths are reported in place of the limits. period_from and period_to are the first and last publication years in the data, as 1 January and 31 December of those years (the claim's period is of publication years). A cross-check compares estimates and half-widths within 1e-9 and counts exactly.

**Run time:** to be fixed from the end-to-end test on synthetic data before this plan is approved.

## Tests

test_run.R, run by test.sh in the pinned image sealed as the reference runner seals a bundle. Part 1 tests the comparison on made-up model results: the published figures are confirmed; figures within rounding of them are confirmed; each of the 21 compared numbers moved alone by 0.006 costs exactly one mismatch; ties round away from zero (0.335 to 0.34) and 0.3349999 does not; a wrong k in either model is a refutation; a figure of NaN, Inf or NA, or a missing count, is inconclusive; a coefficient not found by name stops the run; the outputs number at most 20. Part 2 runs run.R end to end, with the authors' own script, on synthetic data (synth.R) with the real file's 24 columns, 447 rows from 212 publications (the script's forest plot assumes 447 rows), known true effects by domain, and the clutter real files carry: a byte-order mark, Windows line ends, quoted commas, NA tokens, some variances in E notation, and a hidden file beside the data. It checks that the script runs to its end, that both models use every row, that each domain's true value lies within its estimated interval, and that the synthetic figures do not meet Table 2, so the comparison can fail.

**What the tests found while the code was written** (8 October 2026, synthetic data only): the wrapper first carried coefficient names into the figures it read, which would have stopped the real run (fixed, and tested); the authors' forest plot (line 259) assumes exactly 447 rows, so the synthetic data have 447; and the script's selmodel() calls need numDeriv, which the image lacked (now vendored). Each would have made the real run stop, and so made the receipt inconclusive.

**Independent re-implementation** (PLAYBOOK.md, statistical practice 7): before approval, a model of another family, working from this plan alone and without sight of run.R or compare.R, writes its own implementation of the two models (three-level random-effects meta-analysis by restricted maximum likelihood, with cluster-robust standard errors by study as metafor 3.0-2's robust() computes them, with and without its small-sample adjustment), and its estimates and limits are compared with run.R's on the synthetic data. The real data are never used for this.

## Checks before the outcome is judged

1. Every input matches its fingerprint and size (the runner, and run.R for the two files it reads).
2. metafor 3.0-2 installs and loads.
3. Both named models exist after the script has run, and every compared row is found by name.
4. Every count and compared figure is a finite number.

If check 1, 2 or 3 fails, run.R writes no outputs and the receipt is filed as inconclusive, or as an attempt, saying exactly what stopped it. Check 4 failing is "inconclusive" by the claim's test.

## Outcome rule

The claim's test, unchanged, applied in this order. **Inconclusive** if the run stops or times out before both named models are fitted, or gives no finite value for a compared figure. Otherwise **failed** if k_primary or k_domain is not 447, or if mismatches is above 0. Otherwise **confirmed**. Whatever the outcome, the result is filed.

If the outcome is "failed", the result is still filed by this rule, and the outputs are reported to the operator in full, with the size of each difference, before anyone says what a difference means. A failure can arise from the authors' reporting, from the posted files differing from those they analysed, or from the software versions; the result would say which of these the evidence allows and would claim no more.

## What was already known

The targets are the published figures, so the check is not blind; it can only show whether the posted materials give them. Before this plan, Calopteryx read the authors' script (code only: to name the compared figures, to find what it needs to run, and to find its fixed counts) and, from the data, only the column names, the category labels, the shapes of values in seven columns (for example whether a variance is written in E notation), the number of rows, and the publication and study counts. No model was fitted to the real data, and no estimate was computed or seen. The paper's figures are disputed in three letters in PNAS (2022), which concern how the evidence should be weighed and are untouched by this check.

## Forecast

Probability that the outcome is "confirmed": 0.80. For: the script and data were posted together as the corrected materials, the script's own forest-plot label prints "d = .43 [0.38, 0.48]", matching the corrected table, and metafor's estimates are deterministic given the same version. Against: the corrected abstract and Table 2 disagree on the number of effect sizes (440 against 447), a sign that the correction was not prepared with complete care; a figure lying close to a rounding boundary could round differently under small numerical differences; and the versions the authors used are not stated. This forecast is made before any contact with the results and will not be revised after it.
