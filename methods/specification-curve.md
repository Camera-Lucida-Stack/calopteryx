# Specification curve and multiverse analysis

## What it says

Simonsohn, Simmons and Nelson (2020) start from the observation that empirical results hinge on analytical decisions that are defensible, arbitrary and sometimes motivated, which probably introduce bias towards the authors' narrative and certainly add variability that standard errors do not show. Specification curve analysis has three steps: (1) identify the set of specifications that are theoretically justified, statistically valid and not redundant; (2) display every result graphically, so that readers can see which decisions matter; and (3) conduct joint inference across all the specifications. Applied to three published findings, it showed one to be robust, one weak and one not robust at all.

Steegen, Tuerlinckx, Gelman and Vanpaemel (2016) propose the closely related multiverse analysis, which concentrates on the construction of the dataset: every reasonable way of excluding, transforming and coding the raw data is carried out, the analysis is run on each resulting dataset, and the spread of conclusions shows how much they depend on arbitrary choices and which choices matter most.

## When it applies

When a result could depend on reasonable analytic choices (PLAYBOOK.md, Statistical practice, 4), and especially where the data were assembled by many small decisions, as scraped data always are: which records to deduplicate and how, which thresholds of goal to apply, how to treat projects in other currencies, and which period counts.

## When it does not

It is no substitute for a pre-registered primary analysis: the curve shows how fragile a result is, and the pre-registered specification remains the test. Its first step is itself a judgement, and a curve built from specifications chosen to agree with one another proves little. Including invalid or redundant specifications to make a curve look broad misleads in the other direction.

## Questions it prompts

- Which decisions in assembling and analysing these data were arbitrary, and which were dictated by the claim?
- Is every specification included valid for the claim's population and period, or do some quietly change what is being tested (and so belong to an extension)?
- Is the set fixed before the results are seen?
- Which single decision moves the result most, and is that decision defensible on grounds other than its effect?

## For the Kickstarter work

Instar-1's pre-registration already varied the goal limits (nominal, adjusted for inflation, no upper limit). A specification curve would set those beside the other decisions the data force: deduplication across scrapes, the scrapes used for each year, the treatment of currency, and whether projects whose funding ratio lies exactly on 1 are counted as just over (PLAYBOOK.md, Data handling, 5, on thresholds and rounding).

## Debates

The two papers differ in emphasis: the multiverse centres on the construction of the data, the specification curve on the whole space of analyses with joint inference across it. How the set of reasonable specifications should be chosen, and by whom, is the point on which any such analysis is most open to challenge, since its conclusions depend on it.

## Citations

- Simonsohn, U., Simmons, J. P., & Nelson, L. D. (2020). Specification curve analysis. *Nature Human Behaviour*, 4(11), 1208–1214. https://doi.org/10.1038/s41562-020-0912-z
  - Publisher correction: *Nature Human Behaviour*, 4(11), 1215. https://doi.org/10.1038/s41562-020-00974-w
- Steegen, S., Tuerlinckx, F., Gelman, A., & Vanpaemel, W. (2016). Increasing transparency through a multiverse analysis. *Perspectives on Psychological Science*, 11(5), 702–712. https://doi.org/10.1177/1745691616658637

Verified 7 October 2026: all three records against Crossref. Content checked against the abstracts only (Simonsohn and colleagues' from PubMed, PMID 32719546, since the publisher withholds it from Crossref; Steegen and colleagues' from Crossref). The correction's content has not been read, and the method's details beyond the abstract, including how the joint inference is carried out, are to be read in the full paper before the method is used.
