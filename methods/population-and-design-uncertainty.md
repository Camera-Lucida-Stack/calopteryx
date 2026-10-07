# Uncertainty when the data are a population

## What it says

Abadie, Athey, Imbens and Wooldridge (2020) ask what estimated parameters and standard errors mean when the data cover a whole population, such as all fifty states of the United States or all visits to a website. Researchers usually assume that the data are a random sample from a larger population and report standard errors meant to capture sampling variation, even when it is hard to say what that population is or how it differs from the data. The authors set out an alternative, partly design-based approach. Where the values of some regressors could have been different, for example through an intervention, uncertainty arises from not knowing what the outcome would have been under those alternatives. They derive standard errors that capture this design-based uncertainty in place of, or as well as, sampling-based uncertainty, show that these are in general smaller than the usual standard errors that assume an infinite population, and give conditions under which the two coincide.

## When it applies

Whenever the data are, or are claimed to be, the whole population of interest (PLAYBOOK.md, Statistical practice, 5), and whenever the population behind a sample cannot be named. Scraped records of a platform's projects are a common case.

## When it does not

When the data are a genuine random sample from a population that can be stated, the usual sampling-based standard errors keep their ordinary meaning. Purely descriptive statements about a population that is fully observed need no standard error at all: the share of funded projects within 3% of their goal in a complete record is a fact about that record, and needs no estimate.

## Questions it prompts

- Are these data the population, a random sample from it, or neither?
- If neither, what process decided which units are present, and could it be related to the outcome?
- Is the claim descriptive (what happened among these projects) or causal (what would have happened had something been different)? Only the second calls for design-based uncertainty.
- Would a reader take a confidence interval to describe uncertainty that does not exist, or miss uncertainty that does?

## For the Kickstarter work

Web Robots scrapes are neither a complete population nor a random sample. Kickstarter has limited the historical projects shown in each category since April 2015 (research/crowdfunding/PREREGISTRATION.md), so a project's presence in a later scrape may depend on its own outcome, a possibility Instar-1 met with the video field (research/crowdfunding/DEVIATIONS.md, 1). Before any uncertainty is attached to a trend, the scoping note must establish, by counting, how complete each launch year is, and must state whether the claims are descriptive of the projects present or about Kickstarter projects in general. Coverage that varies by year can itself create an apparent trend.

## Debates

The authors present their approach as an alternative to standard practice and show that conventional standard errors can be larger than design-based ones; when each is the appropriate statement of uncertainty depends on the question asked, which is why every claim states its population and whether it is descriptive or causal.

## Citations

- Abadie, A., Athey, S., Imbens, G. W., & Wooldridge, J. M. (2020). Sampling-based versus design-based uncertainty in regression analysis. *Econometrica*, 88(1), 265–296. https://doi.org/10.3982/ECTA12675

Verified 7 October 2026 against Crossref. Content checked against the abstract only (an open copy is held at MIT, https://hdl.handle.net/1721.1/136224, and is to be read in full before the method is used); nothing is said of the paper beyond what the abstract supports. The application to Kickstarter is Calopteryx's.
