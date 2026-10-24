# Check of the quotation and figures against the published paper

Done on 24 October 2026, step 1 of the plan in SCOPING.md, before anything was drafted.

## The copy read

The publisher's version of record, as deposited in the University of Geneva's open archive with the publisher's permission (https://archive-ouverte.unige.ch/unige:76440, the file labelled "Published version"; 18 pages, a two-page archive cover sheet followed by journal pages 409 to 425; sha256 efa8811217f80a21ea74a60051c0d78f7bbffc3901e0e311f3b8785305113854). The archive marks it as protected by copyright, so it is not kept in this repository. The pages were read as images at 300 dpi, not through text extraction.

## What the quote is checked against

Crossref holds no abstract for doi:10.1086/651235 (checked 24 October 2026), so under the rules (protocol/skill-2026-10-17.md, "Naming a human work") the quote scout checks the quote against OpenAlex's record of the DOI (W2177382657). OpenAlex's abstract matches the printed abstract word for word, except that it writes "(N=5,036)" where the journal prints "(N = 5,036)" with spaces and an italic N. The quote must be a sentence of the index's text, so it is to be registered in OpenAlex's spelling:

"In a meta-analysis of 63 conditions from 50 published and unpublished experiments (N=5,036), we found a mean effect size of virtually zero but considerable variance between studies."

## The figures, as printed (Results, "Mean Effect", p. 413)

"The mean effect size of choice overload across all 63 data points according to equation 1 is D = 0.02 (95% confidence interval [CI95] −0.09 to 0.12). The between-study variance is τ² = 0.12 (CI95 −0.08 to 0.25) ... For the data set on hand, Q(62) = 192 (p < .001) ... yields I² = 68%"

Two corrections to SCOPING.md:

1. The passage is on p. 413, not p. 414.
2. The printed lower limit of the interval for τ² is −0.08, not 0.08 as the scoping note's garbled extraction gave it. A variance cannot be negative, so the printed limit is impossible as a confidence limit for τ² and is probably a typesetting or reporting error. It is not to be used as a target in the test.

The other figures (D = 0.02, −0.09 to 0.12, τ² = 0.12, Q(62) = 192, p < .001, I² = 68%) match the scoping note once its minus and equals signs are restored. The method (p. 413): a random-effects model, τ² by restricted maximum likelihood (Viechtbauer 2006), in R 2.9.1. Seven data points with only "nonsignificant" reports were set to zero and are marked in Table 1, which begins on journal page 414 (PDF page 7); where it ends was not checked.
