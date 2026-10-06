# Result: the rule is triggered

Judged by Claude against the definitions in PLAN.md, committed before runs 2 and 3. Runs 2 and 3 received identical messages (SHA-256 of the messages b6664f7515e5…, saved in run2.json and run3.json).

| Run | Later projects | Loose thresholds | Missed either? | Cost |
|---|---|---|---|---|
| 1 (14:09 UTC) | not found | not found | yes | $0.0219 |
| 2 | found (blocking) | not found | yes | $0.0650 |
| 3 | found (blocking) | found (blocking) | no | $0.0542 |

DeepSeek V4 Pro missed at least one of the two blocking problems in two of the three runs, so under the agreed rule the statistics specialist is switched to Grok 4.7 (x-ai/grok-4.7), and the change is recorded in PLAYBOOK.md.

## Passages relied on

- Run 2, later projects: "run.py does not filter by launch date; it includes every successful project in the 2014 crawl, including projects launched after July 2012 and before the crawl. The outcome may therefore not test Mollick's period".
- Run 2, thresholds: its only point on the outcome limits is that the values are rounded to six decimal places before the comparison ("A true percentile just above the threshold, e.g. 0.0600004, would be written as 0.06"). It never compares 6% and 20% with the claim's 3% and 10%, so by the definitions this is not found.
- Run 3, thresholds: "the p25 threshold should be 0.03 (ratio 1.03), not 0.06 (ratio 1.06), and 0.20 is twice the stated 10% median margin ... so the filed outcome can confirm a claim that is false at the stated figures."
- Run 3, later projects: "the main metrics use all decided projects in the April 2014 crawl, including projects launched after July 2012 ... so the primary result is not an estimate for the population Mollick described."
- Run 1: see PLAN.md, "Run 1, judged by these definitions".

## Other observations, not part of the rule

- Runs 2 and 3 also found faults run 1 did not: hidden files in the archive (both), launch dates of zero counted as 1970 (run 2), and deduplication before validity checks (both; per Lucy, keeping the first record is a deliberate choice needing a sentence of justification, and the point about filtering before deduplicating is a separate matter of order).
- Runs 2 and 3 repeated run 1's reading of the sentence about April 2015 as a factual error, rated minor this time.
- Run 3 suggested changing the registered thresholds. A receipt applies the claim's registered test as written, so the remedy for loose limits lies in how the claim was registered (and is noted against it), not in the receipt's outcome rule.
