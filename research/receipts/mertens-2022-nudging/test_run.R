# Tests for the Mertens reproduction check (PLAN.md). Base R, in the pinned image, from the checkout's root:
#   sh research/receipts/mertens-2022-nudging/test.sh <path to mhhb_nma_analysis.R, verified by its SHA-256>
# Part 1 tests compare.R on made-up model objects. Part 2 runs run.R end to end, with the authors' own script, on
# synthetic data with known true effects and the clutter real files carry; no real data are read.

here <- "research/receipts/mertens-2022-nudging"
source(file.path(here, "compare.R"))
failures <- 0
check <- function(ok, what) { if (!isTRUE(ok)) { failures <<- failures + 1; cat("FAIL:", what, "\n") } else cat("ok:", what, "\n") }

# ---- Part 1: the rounding rule and the outcome rule --------------------------------------------------------------
check(identical(round_half_away(c(0.125, -0.125, 0.135, 0.005, -0.005, 0.43, 0.1249999, 0.4349)),
                c(0.13, -0.13, 0.14, 0.01, -0.01, 0.43, 0.12, 0.43)), "rounds half away from zero, unlike round()")
check(round(0.125, 2) == 0.12, "R's own round() would round 0.125 down (why it is not used)")

fake <- function(f = TARGETS, k1 = K, k2 = K) {
  p <- list(k = k1, beta = matrix(f$est[1], dimnames = list("intrcpt", NULL)), ci.lb = f$lb[1], ci.ub = f$ub[1])
  d <- list(k = k2, beta = matrix(c(f$est[-1], 0.02), dimnames = list(c(f$coef[-1], "scale(year)"), NULL)),
            ci.lb = c(f$lb[-1], -0.01), ci.ub = c(f$ub[-1], 0.05))
  extract(p, d)
}
check(judge(fake())$outcome == "confirmed" && judge(fake())$mismatches == 0, "the published figures are confirmed")
near <- TARGETS; near$est <- near$est + 0.0049; near$lb <- near$lb - 0.0049; near$ub <- near$ub + 0.0049
check(judge(fake(near))$outcome == "confirmed", "figures within rounding of the table are confirmed")
for (col in c("est", "lb", "ub")) for (i in seq_len(nrow(TARGETS))) {
  f <- TARGETS; f[[col]][i] <- f[[col]][i] + 0.006
  v <- judge(fake(f))
  check(v$outcome == "failed" && v$mismatches == 1, sprintf("one figure off (%s, %s) costs exactly one", TARGETS$figure[i], col))
}
f <- TARGETS; f$est[2] <- 0.335   # a tie rounds away from zero, to 0.34: a match
check(judge(fake(f))$outcome == "confirmed", "a tie at 0.335 rounds to 0.34")
f <- TARGETS; f$est[2] <- 0.3349999
check(judge(fake(f))$outcome == "failed", "0.3349999 rounds to 0.33: a mismatch")
check(judge(fake(k1 = 446))$outcome == "failed", "k of 446 in the overall model is a refutation")
check(judge(fake(k2 = 448))$outcome == "failed", "k of 448 in the domain model is a refutation")
for (bad in c(NaN, Inf, NA)) {
  f <- TARGETS; f$ub[4] <- bad
  check(judge(fake(f))$outcome == "inconclusive", sprintf("a compared figure of %s is inconclusive", bad))
}
check(judge(fake(k2 = NA))$outcome == "inconclusive", "a missing count is inconclusive")
renamed <- tryCatch({ d <- fake(); p <- list(k = K, beta = matrix(0.43, dimnames = list("intercept", NULL)),
  ci.lb = 0.38, ci.ub = 0.48); extract(p, list(k = K, beta = matrix(1, dimnames = list("x", NULL)), ci.lb = 0, ci.ub = 2)); FALSE },
  error = function(e) TRUE)
check(renamed, "a coefficient not found by name stops the run")
o <- outputs(fake(), judge(fake()), TRUE, c(1982, 2021, 2000))
check(length(o) - 2 <= 20, sprintf("at most 20 outputs besides the period (%d)", length(o) - 2))
check(o$period_from == 19820101 && o$period_to == 20211231, "period read from the years in the data")
check(isTRUE(all.equal(o$hw_food, 0.18)), "half-width of the interval")

# ---- Part 2: run.R end to end on synthetic data ------------------------------------------------------------------
args <- commandArgs(trailingOnly = TRUE)
script <- args[1]
source(file.path(here, "synth.R"))
dir <- tempfile("synthetic"); dir.create(dir)
syn <- make_synthetic(dir); truth <- syn$truth; k <- syn$k; csv <- syn$csv

res <- file.path(dir, "results")
status <- system2("Rscript", c(file.path(here, "run.R"), "--test", script, csv, res))
check(status == 0, "run.R completes on the synthetic data")
out <- jsonlite::read_json(file.path(res, "outputs.json"))
check(out$k_primary == k && out$k_domain == k, sprintf("both models fitted on all %d synthetic effect sizes", k))
check(out$script_completed == 1, "the authors' script ran to its last line")
check(length(out) - 2 <= 20, "at most 20 outputs besides the period")
check(out$period_from == 19820101 && out$period_to == 20211231, "period from the synthetic years")
for (d in names(truth)) {
  key <- if (d == "pro-social") "prosocial" else d
  est <- out[[paste0("est_", key)]]; hw <- out[[paste0("hw_", key)]]
  check(abs(est - truth[[d]]) <= hw, sprintf("%s: true value %.2f inside the estimated interval (%.3f +/- %.3f)", d, truth[[d]], est, hw))
}
check(out$mismatches > 0, "synthetic data do not meet the published targets (the comparison can fail)")

if (dir.exists("/keep")) file.copy(c(csv, file.path(res, "outputs.json")), "/keep", overwrite = TRUE)   # see test.sh

cat(if (failures == 0) "\nall tests passed\n" else sprintf("\n%d test(s) FAILED\n", failures))
quit(status = if (failures == 0) 0 else 1)
