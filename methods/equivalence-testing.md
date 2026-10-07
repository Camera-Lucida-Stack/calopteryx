# Equivalence testing

## What it says

Lakens (2017) notes that researchers often conclude wrongly that an effect is absent because a result is not statistically significant. Equivalence testing lets them support the absence of a meaningful effect within a frequentist framework. An upper and a lower equivalence bound are set from the smallest effect size of interest, and the two one-sided tests (TOST) procedure tests whether the observed effect lies inside those bounds, so that an effect large enough to be worth examining can be rejected.

## When it applies

When a claim is that something has not changed, or that a new estimate matches an original one, and especially with very large datasets, in which almost any difference is statistically significant. Instar-1's Kickstarter pre-registration used it for this reason, with a smallest difference of interest of 5 percentage points for shares and 0.05 for funding ratios, fixed before the data were examined.

## When it does not

It needs a smallest effect of interest that can be justified independently of the data; bounds chosen after seeing the results make the test meaningless. Where the data are the whole population of interest, there is no sampling error to test against, and the comparison with the bounds is made directly (see population-and-design-uncertainty.md). Equivalence with a published figure does not show that the figure was right: it shows only that the new estimate is close to it.

## Questions it prompts

- What is the smallest difference that would change how a researcher, a founder or a policymaker reads the finding, and why?
- Are the bounds fixed in the pre-registration, before any data are seen?
- Are the bounds stated relative to the original's own figures and their uncertainty (PLAYBOOK.md, Registering a claim, 4)?
- Is a result that is neither equivalent nor different reported as inconclusive?

## For the Kickstarter work

A trend claim, such as that the share of funded projects within 3% of their goal has changed since Mollick's period, needs a smallest change of interest fixed in advance, for the same reason as before: with the very large numbers of projects in the scrapes, a trivial change would be significant.

## Debates

Setting the smallest effect of interest is a judgement, and of everything in an equivalence test it is the most open to challenge; it is therefore reasoned in the pre-registration in plain terms.

## Citations

- Lakens, D. (2017). Equivalence tests: A practical primer for t tests, correlations, and meta-analyses. *Social Psychological and Personality Science*, 8(4), 355–362. https://doi.org/10.1177/1948550617697177

Verified 7 October 2026 against Crossref. Content checked against the abstract only; nothing is said of the paper beyond what the abstract supports.
