# DeepSeek V4 Pro: two further runs on the 301937d draft (rule agreed in advance)

Agreed with Lucy on 6 October 2026, before either run, and committed before either run.

## The rule

DeepSeek V4 Pro (deepseek/deepseek-v4-pro-0813) reviews the same draft three times in all: the run already made (records/reviewer-trials/2026-10-06-mollick-301937d) and two more, with the draft, the attachments and the instructions unchanged. If it misses either of the two blocking problems in two or more of the three runs, the statistics specialist is switched to Grok 4.7 (x-ai/grok-4.7 on OpenRouter), which found them in last week's comparison, and the change and its reason are recorded in PLAYBOOK.md.

## The two blocking problems, and what counts as finding each

A problem counts as found if a review states it in substance, at any severity; the severity given is recorded.

1. **Later projects.** The review says that the analysis includes, or fails to exclude, projects launched after July 2012, outside Mollick's period (2009 to July 2012), so that the result does not test the claim on its own population and period. Saying only that the crawl was taken after that period, or only that the reported share of early projects is miscomputed, does not count.
2. **Loose thresholds.** The review says that the outcome limits (25th percentile of over-funding above 6%, median above 20%) are looser than the claim's own figures (a quarter of funded projects 3% or less over goal; half about 10% over), so that the test could confirm a claim that is false, or cannot tell the claim apart from a weaker one. Points only about rounding at a threshold, the percentile convention, or adding an allowance for uncertainty do not count.

## Run 1, judged by these definitions

Run 1 (14:09 UTC) found neither. It said the crawl was taken after Mollick's period and that the early-project share was miscomputed, which the definitions exclude, and its only threshold points concerned the percentile convention, rounding and an uncertainty margin. Run 1 is therefore one miss, so a miss in either of the two further runs triggers the switch.

## Conduct

- The draft (outbox/trial-mollick-2014/draft.json), its two attachments (the files at 301937d) and reviewers/statistics.txt (SHA-256 d5bf36c443ce578061721cc147f171fefb363954236106c8331b112af6f07831) are unchanged. The item's timestamp, which the tool sets afresh for an unsigned preview, is fixed for runs 2 and 3 so that both receive identical messages; run 1 differed from them only in that timestamp.
- Each run's full reply, the exact messages sent and its cost are saved here. Claude judges each run against the definitions above and quotes the passages relied on; Lucy can check every judgement against the saved replies.

## Note from Lucy on run 1

Keeping the first record per project was a deliberate choice, matching the registered test and Chrysalis-2's method. DeepSeek's objection to it is treated as a judgement call that needs a sentence of justification in the plan, and not as a fault.
