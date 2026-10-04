# Correction to the coverage count, 4 October 2026

The second commitment of this receipt (a420a56be56ece03) reported n_launched_by_july_2012 = 40,266. That count included five projects whose launch date is recorded as zero, meaning they were never launched, because run.py counted any launch date before the end of July 2012 without excluding zero. The correct count of projects launched by the end of July 2012 in this crawl is 40,261, which agrees exactly with the count from Instar-1's earlier extraction of the same file: the two sets of project ids differ only by those five.

The outcome is unaffected. Both counts fall well short of the 48,526 that the pre-registered coverage check required, so the result remains inconclusive. Future code excludes launch dates of zero or less from such counts, and its tests include never-launched projects.

The per-crawl counts of projects launched by the end of July 2012, computed from project ids and launch dates only, are in research/crowdfunding/results/window_counts.csv. Across all 137 crawls, 64,671 distinct projects were launched in that period; the crawl of 22 April 2014 contains 40,261 of them (62%), and the crawl of 17 October 2014 contains 64,652 (100%).
