# Grok 4.7: three runs on the 301937d draft (rule agreed in advance)

Agreed with Lucy on 6 October 2026, and committed before any of the three runs.

## The rule

Grok 4.7 (x-ai/grok-4.7 on OpenRouter), now the statistics specialist, reviews the same draft three times, on the same footing as DeepSeek V4 Pro in records/reviewer-trials/2026-10-06-deepseek-repeat/: the same item, attachments and instructions, so the same messages. If it misses either of the two blocking problems in two or more of the three runs, the reviewer is NOT switched again: the work stops and is reported to Lucy, to consider whether the instructions or the task are the issue. If it misses either in at most one run, it passes and rebuild step 4 begins.

## What counts as finding each problem

Exactly as in records/reviewer-trials/2026-10-06-deepseek-repeat/PLAN.md. A problem counts as found if a review states it in substance, at any severity; the severity given is recorded.

1. **Later projects.** The review says that the analysis includes, or fails to exclude, projects launched after July 2012, outside Mollick's period (2009 to July 2012), so that the result does not test the claim on its own population and period. Saying only that the crawl was taken after that period, or only that the reported share of early projects is miscomputed, does not count.
2. **Loose thresholds.** The review says that the outcome limits (25th percentile of over-funding above 6%, median above 20%) are looser than the claim's own figures (a quarter of funded projects 3% or less over goal; half about 10% over), so that the test could confirm a claim that is false, or cannot tell the claim apart from a weaker one. Points only about rounding at a threshold, the percentile convention, or adding an allowance for uncertainty do not count.

## Conduct

- The messages are those sent to DeepSeek in its runs 2 and 3 (SHA-256 of the messages beginning b6664f7515e5): reviewers/statistics.txt unchanged (SHA-256 d5bf36c4…), the draft with its timestamp fixed at 2026-10-06T14:20:00Z, and the two files from 301937d. Each run checks that its messages hash to the same value before it is sent, and stops if not.
- Each run's full reply, the messages sent and its cost are saved here. Claude judges each run against the definitions above and quotes the passages relied on.
