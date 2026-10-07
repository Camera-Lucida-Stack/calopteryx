# Bunching and density tests at a threshold

## What it says

Where a rule changes sharply at a threshold, people and organisations respond, and the distribution of the quantity concerned shows an excess just on the favourable side. Kleven (2016) reviews bunching approaches, which exploit discontinuities in the slope of a choice set (kinks) or in its level (notches) to study behaviour. Developed for taxation, they have spread to social security, welfare, education, regulation, prices and reference-dependent preferences. His review is a guide to estimation, its strengths and its weaknesses.

McCrary (2008) gives a formal test for such sorting at a cutoff. Its intuition is that if a favourable outcome lies just past a threshold, there will be surprisingly many cases just past it and surprisingly few just short. The test asks whether the density of the running variable is discontinuous at the cutoff. It proceeds in two steps: a finely gridded histogram, then local linear smoothing of that histogram separately on each side of the cutoff, presented graphically with the histogram. McCrary notes that the test is informative when manipulation is monotonic, that is, when it moves cases in one direction only, and that a smooth density is neither necessary nor sufficient for the regression discontinuity design to be valid, except under further assumptions.

Cattaneo, Jansson and Ma (2020) introduce a local polynomial density estimator that is boundary adaptive and automatic and does not require binning the data first, with principled estimation, inference and bandwidth selection, and use it to build a test for a discontinuity in density. They provide software for Stata and R.

## When it applies

When a claim concerns an excess or shortage of cases just past a threshold, or when a design that relies on a threshold needs evidence that cases did not sort around it.

## When it does not

A discontinuity in density shows that something happens at the threshold, never by itself what. Sorting by the people affected, a rule applied by someone else, and an artefact of how the data were recorded can all produce one. If manipulation runs in both directions, McCrary's test may not detect it. A quantity that takes only a few distinct values near the threshold, or that is stored inexactly, needs care before any density is estimated.

## Questions it prompts

- Is the threshold a kink or a notch, and for whom: the person who sets it, or those who respond to it?
- What mechanisms could create an excess just past it, and which could the data distinguish?
- How is the value exactly at the threshold coded, and is it compared with a stated tolerance (PLAYBOOK.md, Data handling, 5)?
- Do the results depend on the bandwidth or the width of bins, and is that dependence shown?

## For the Kickstarter work

Kickstarter's all-or-nothing rule appears to be a notch in Kleven's sense: a project that reaches its goal receives the money pledged, and one that falls short receives nothing. That reading is Calopteryx's own application; none of the sources above makes it. Mollick (2014) wrote that "Projects that succeed tend to do so by relatively small margins. Twenty five percent of projects that are funded are 3% or less over their goal, and only 50% are about 10% over their goal." That is a statement about the distribution of the funding ratio just above 1, which these methods can measure, test and track across launch years. (The quotation is as Instar-1 registered it on the earlier record; it is to be re-read in the paper itself before the claim is registered on the current one.) Several mechanisms could produce such a pattern (backers who stop pledging once a goal is met, backers who rally to a project close to its goal, creators who set goals they expect to reach), and the scoping note must say which, if any, the data can separate.

## Debates

Kleven's review discusses the strengths and weaknesses of bunching estimation in detail; those are to be read in full before the method is used. The choice between binned approaches, such as McCrary's, and estimators that need no binning, such as that of Cattaneo and colleagues, is a practical question of how sensitive results are to tuning choices, and both may be reported.

## Citations

- Kleven, H. J. (2016). Bunching. *Annual Review of Economics*, 8(1), 435–464. https://doi.org/10.1146/annurev-economics-080315-015234
- McCrary, J. (2008). Manipulation of the running variable in the regression discontinuity design: A density test. *Journal of Econometrics*, 142(2), 698–714. https://doi.org/10.1016/j.jeconom.2007.05.005
- Cattaneo, M. D., Jansson, M., & Ma, X. (2020). Simple local polynomial density estimators. *Journal of the American Statistical Association*, 115(531), 1449–1455. https://doi.org/10.1080/01621459.2019.1635480
- Mollick, E. (2014). The dynamics of crowdfunding: An exploratory study. *Journal of Business Venturing*, 29(1), 1–16. https://doi.org/10.1016/j.jbusvent.2013.06.005

Verified 7 October 2026: all four against Crossref. McCrary checked against the full text of his working paper (NBER Technical Working Paper 334, January 2007), abstract, introduction and section on identification. Kleven and Cattaneo and colleagues checked against their abstracts only (from OpenAlex, Crossref holding none for Cattaneo and colleagues), and nothing is said of them beyond what the abstracts support.
