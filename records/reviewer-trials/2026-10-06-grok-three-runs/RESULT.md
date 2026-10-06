# Result: Grok 4.7 passes

Judged by Claude against the definitions in PLAN.md, committed before the runs. All three runs received the same messages as DeepSeek's runs 2 and 3 (SHA-256 beginning b6664f7515e5, checked before each call).

| Run | Later projects | Loose thresholds | Missed either? | Cost | Time |
|---|---|---|---|---|---|
| 1 | found (blocking) | found (major) | no | $0.1889 | about 23 minutes |
| 2 | found (blocking) | found (major) | no | $0.1357 | about 4 minutes |
| 3 | found (blocking) | found (blocking) | no | $0.2405 | about 7 minutes |

Grok 4.7 missed neither blocking problem in any run, so under the rule it remains the statistics specialist and rebuild step 4 begins.

## Passages relied on

- Run 1, later projects: "Projects launched from August 2012 through the crawl date, and projects with missing or unparsable dates, enter the figures that confirm or refute the claim."
- Run 1, thresholds: "Those gates are wider than the claim's own figures ... A confirm result can therefore be filed when fewer than 25% are within 3% and the median is far from 10% (for example 5% and 19%)."
- Run 2, later projects: "The crawl also contains launches from August 2012 through April 2014, a high-volume period, and those projects enter the judged percentiles."
- Run 2, thresholds (the closest call of the six judgements): "The quoted finding is that 25% of funded projects are 3% or less over goal and only 50% are about 10% over (ratio about 1.03 and 1.10). The filed rule confirms the claim unless success_p25_over exceeds 0.06 or success_median_over exceeds 0.20 (ratios 1.06 and 1.20) ... a 'confirmed' outcome does not mean the quoted 3% and 10% statements are true." It sets the limits beside the claim's figures and says a confirmation would not show the claim true, which is the definition's "could confirm a claim that is false"; like GPT-6.1 Sol, it treats the remedy as disclosure, since the limits are the registered ones.
- Run 3, both: "The rule refutes only if the nearest-rank 25th percentile of over-funding exceeds 0.06 or the median exceeds 0.20, twice the claim's margins ... A median 19% over goal and a 25th percentile 5.9% over would be filed as confirmation of a 3% and 10% claim"; "including campaigns launched from August 2012 through the crawl date".

## Other observations, not part of the rule

- Every run also found the hidden archive files and the launch dates of zero counted as 1970, which neither GPT-6.1 Sol nor DeepSeek's first run found; runs 1 and 3 found the floating-point problem at exactly 3% and 10%.
- Like the other reviewers, all three read the sentence about April 2015 as a factual error, and all flagged the placeholder key and the Instar-1/Calopteryx naming, which come from the trial's setup.
- Cost and time: about $0.19 and up to 23 minutes a review, against about $0.02 to $0.06 for DeepSeek. The tool now gives up on a reviewer call after 30 minutes.
