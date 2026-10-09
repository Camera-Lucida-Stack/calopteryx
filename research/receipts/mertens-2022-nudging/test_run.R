# Tests for the Mertens reproduction check (PLAN.md). Base R, in the pinned image, from the checkout's root:
#   sh research/receipts/mertens-2022-nudging/test.sh <path to mhhb_nma_analysis.R, verified by its SHA-256>
# Part 1 tests compare.R on made-up model objects. Part 2 runs run.R end to end, with the authors' own script, on
# synthetic data with known true effects and the clutter real files carry; no real data are read.

here <- "research/receipts/mertens-2022-nudging"
source(file.path(here, "compare.R"))
failures <- 0
check <- function(ok, what) {        # a test whose own code stops with an error counts as failed, and the rest still run
  ok <- tryCatch(isTRUE(ok), error = function(e) { cat("error:", conditionMessage(e), "\n"); FALSE })
  if (!ok) { failures <<- failures + 1; cat("FAIL:", what, "\n") } else cat("ok:", what, "\n")
}

# ---- Part 1: the rounding rule and the outcome rule --------------------------------------------------------------
check(identical(round_half_away(c(0.125, -0.125, 0.135, 0.005, -0.005, 0.43, 0.1249999, 0.4349)),
                c(0.13, -0.13, 0.14, 0.01, -0.01, 0.43, 0.12, 0.43)), "rounds half away from zero, unlike round()")
check(round(0.125, 2) == 0.12, "R's own round() would round 0.125 down (why it is not used)")

# Every tie next to one of the 21 published numbers (x.xx5), as R stores it, with the hexadecimal form of that stored
# value and its rounding, both worked out with Python's exact decimal arithmetic (decimal.Decimal), independently of
# round_half_away(). A tie stored a hair below rounds down; that is the rule applied to the value as computed.
TIES <- read.csv(text = "tie,hex,rounded
0.085,0x1.5c28f5c28f5c3p-4,0.09
0.095,0x1.851eb851eb852p-4,0.10
0.135,0x1.147ae147ae148p-3,0.14
0.145,0x1.28f5c28f5c28fp-3,0.14
0.235,0x1.e147ae147ae14p-3,0.23
0.245,0x1.f5c28f5c28f5cp-3,0.24
0.255,0x1.051eb851eb852p-2,0.26
0.265,0x1.0f5c28f5c28f6p-2,0.27
0.275,0x1.199999999999ap-2,0.28
0.305,0x1.3851eb851eb85p-2,0.30
0.315,0x1.428f5c28f5c29p-2,0.32
0.325,0x1.4cccccccccccdp-2,0.33
0.335,0x1.570a3d70a3d71p-2,0.34
0.345,0x1.6147ae147ae14p-2,0.34
0.355,0x1.6b851eb851eb8p-2,0.35
0.375,0x1.8000000000000p-2,0.38
0.385,0x1.8a3d70a3d70a4p-2,0.39
0.405,0x1.9eb851eb851ecp-2,0.41
0.415,0x1.a8f5c28f5c28fp-2,0.41
0.425,0x1.b333333333333p-2,0.42
0.435,0x1.bd70a3d70a3d7p-2,0.43
0.465,0x1.dc28f5c28f5c3p-2,0.47
0.475,0x1.e666666666666p-2,0.47
0.485,0x1.f0a3d70a3d70ap-2,0.48
0.515,0x1.07ae147ae147bp-1,0.52
0.525,0x1.0cccccccccccdp-1,0.53
0.535,0x1.11eb851eb851fp-1,0.54
0.545,0x1.170a3d70a3d71p-1,0.55
0.645,0x1.4a3d70a3d70a4p-1,0.65
0.655,0x1.4f5c28f5c28f6p-1,0.66
0.825,0x1.a666666666666p-1,0.82
0.835,0x1.ab851eb851eb8p-1,0.83", colClasses = "character")
all_targets <- c(TARGETS$est, TARGETS$lb, TARGETS$ub)
check(all(sprintf("%.3f", c(all_targets - 0.005, all_targets + 0.005)) %in% TIES$tie), "the table holds both ties of every target")
for (i in seq_len(nrow(TIES))) {
  x <- as.numeric(TIES$tie[i]); want <- as.numeric(TIES$rounded[i])
  ulp <- 2^(floor(log2(x)) - 52)
  below <- as.numeric(substr(TIES$tie[i], 1, 4)); above <- below + 0.01; above <- as.numeric(sprintf("%.2f", above))
  check(as.numeric(TIES$hex[i]) == x &&
        round_half_away(x) == want && round_half_away(-x) == -want &&
        round_half_away(x - ulp) == below && round_half_away(x + ulp) == above &&
        round_half_away(-(x - ulp)) == -below && round_half_away(-(x + ulp)) == -above,
        sprintf("tie %s (stored %s): %s; one step below %.2f, one above %.2f, and the same negated",
                TIES$tie[i], TIES$hex[i], TIES$rounded[i], below, above))
}
check(round_half_away(0.145) == 0.14, "0.145, stored below the tie, rounds to 0.14")
check(round_half_away(0.545) == 0.55, "0.545, stored above the tie, rounds to 0.55")
check(round_half_away(0.435) == 0.43 && floor(0.435 * 100 + 0.5) == 44 && round_half_away(0.345) == 0.34 &&
      floor(0.345 * 100 + 0.5) == 35, "0.435 and 0.345, stored below their ties, round to 0.43 and 0.34 (scaling by 100 gives 0.44, 0.35)")
check(round_half_away(0.3349999999999) == 0.33 && round_half_away(0.334999999995) == 0.33,
      "values just below a tie round down: no tolerance (the old 1e-9 would have given 0.34 for 0.334999999995)")
check(identical(round_half_away(c(NA, NaN, Inf)), c(NA, NaN, Inf)), "non-finite values pass through, to be judged inconclusive")
check(round_half_away(0.995) == 0.99 && round_half_away(0.9951) == 1 && round_half_away(9.996) == 10 &&
      round_half_away(-9.996) == -10, "the carry runs into the units (0.9951 to 1, 9.996 to 10)")

fake_models <- function(f = TARGETS, k1 = K, k2 = K) {
  list(p = list(k = k1, beta = matrix(f$est[1], dimnames = list("intrcpt", NULL)), ci.lb = f$lb[1], ci.ub = f$ub[1]),
       d = list(k = k2, beta = matrix(c(f$est[-1], 0.02), dimnames = list(c(f$coef[-1], "scale(year)"), NULL)),
                ci.lb = c(f$lb[-1], -0.01), ci.ub = c(f$ub[-1], 0.05)))
}
fake <- function(...) { m <- fake_models(...); extract(m$p, m$d) }
check(judge(fake())$outcome == "confirmed" && judge(fake())$mismatches == 0, "the published figures are confirmed")
near <- TARGETS; near$est <- near$est + 0.0049; near$lb <- near$lb - 0.0049; near$ub <- near$ub + 0.0049
check(judge(fake(near))$outcome == "confirmed", "figures within rounding of the table are confirmed")
cols <- c("est", "lb", "ub")
for (j in seq_along(cols)) for (i in seq_len(nrow(TARGETS))) {
  f <- TARGETS; f[[cols[j]]][i] <- f[[cols[j]]][i] + 0.006
  v <- judge(fake(f)); o <- outputs(fake(f), v, c(1982, 2021))
  pos <- (j - 1) * nrow(TARGETS) + i
  check(v$outcome == "failed" && v$mismatches == 1 && o$mismatch_mask == 2^(pos - 1),
        sprintf("one figure off (%s, %s) costs exactly one, and sets bit %d of the mask", TARGETS$figure[i], cols[j], pos))
}
f <- TARGETS; f$est[2] <- 0.335   # stored just above the tie, so it rounds away from zero, to 0.34: a match
check(judge(fake(f))$outcome == "confirmed", "0.335 (stored above the tie) rounds to 0.34")
f <- TARGETS; f$est[2] <- 0.3349999
check(judge(fake(f))$outcome == "failed", "0.3349999 rounds to 0.33: a mismatch")
f <- TARGETS; f$est[4] <- 0.434; f$lb[4] <- 0.434 - 0.1045; f$ub[4] <- 0.434 + 0.1045
check(judge(fake(f))$outcome == "confirmed", "a symmetric interval, 0.434 +/- 0.1045, gives environment's printed 0.43 [0.33, 0.54]")
f <- TARGETS; f[1, c("est", "lb", "ub")] <- list(0.44, 0.37, 0.49); f$ub[7] <- 0.6
o <- outputs(fake(f), judge(fake(f)), c(1982, 2021))
check(o$mismatches == 4 && o$mismatch_mask == 1 + 2^7 + 2^14 + 2^20, "several figures off: each sets its own bit")
check(judge(fake(k1 = 446))$outcome == "failed", "k of 446 in the overall model is a refutation")
check(judge(fake(k2 = 448))$outcome == "failed", "k of 448 in the domain model is a refutation")
for (bad in c(NaN, Inf, NA)) {
  f <- TARGETS; f$ub[4] <- bad
  check(judge(fake(f))$outcome == "inconclusive", sprintf("a compared figure of %s is inconclusive", bad))
}
check(judge(fake(k2 = NA))$outcome == "inconclusive", "a missing count is inconclusive")
check(judge(fake(k1 = NULL))$outcome == "inconclusive", "an absent count (NULL) is inconclusive")
check(judge(fake(k2 = c(K, K)))$outcome == "inconclusive", "a count of two values is inconclusive")
check(judge(fake(k1 = "447"))$outcome == "inconclusive", "a count that is not a number is inconclusive")
m <- fake_models(); m$d$ci.ub <- m$d$ci.ub[1:3]
check(judge(extract(m$p, m$d))$outcome == "inconclusive", "an absent interval limit is inconclusive")
renamed <- tryCatch({ p <- list(k = K, beta = matrix(0.43, dimnames = list("intercept", NULL)), ci.lb = 0.38, ci.ub = 0.48)
  extract(p, list(k = K, beta = matrix(1, dimnames = list("x", NULL)), ci.lb = 0, ci.ub = 2)); FALSE },
  error = function(e) TRUE)
check(renamed, "a coefficient not found by name stops the run")
stops <- function(expr) tryCatch({ force(expr); FALSE }, error = function(e) TRUE)
for (bad in list(c(1982, NA), c(1982, 0), c(1982, 2000.5), c(1982, Inf), c(1899, 2021), c(1982, 2101), c("1982", "2021"),
                 numeric(0)))
  check(stops(outputs(fake(), judge(fake()), bad)), sprintf("years %s stop the run", paste(format(bad), collapse = ", ")))
o <- outputs(fake(), judge(fake()), c(1982, 2021, 2000))
check(o$period_from == 19820101 && o$period_to == 20211231, "a span of 1982 to 2021 gives 19820101 and 20211231")
NAMES <- c("k_primary", "k_domain", paste0(rep(c("est_", "hw_"), 7), rep(TARGETS$figure, each = 2)), "mismatches",
           "mismatch_mask", "period_from", "period_to")
check(identical(names(o), NAMES) && length(o) - 2 == 18, sprintf("the 18 outputs and the period, by name (%d)", length(o) - 2))
check(o$mismatch_mask == 0 && is.integer(o$mismatch_mask), "no mismatch: a mask of 0, as an integer")
check(isTRUE(all.equal(o$hw_food, 0.18)), "half-width of the interval")

# ---- Part 2: run.R end to end ------------------------------------------------------------------------------------
args <- commandArgs(trailingOnly = TRUE)
script <- args[1]
source(file.path(here, "synth.R"))
dir <- tempfile("synthetic"); dir.create(dir)
SEED <- "SEED=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
run <- function(script, csv, res, seed = paste0("ECDYSIS_", SEED))
  system2("Rscript", c(file.path(here, "run.R"), "--test", script, csv, res), env = seed)

# Stand-in scripts, which take seconds where the authors' takes half an hour: one makes the two models (as model-shaped
# objects matching Table 2) and stops with an error; one stops at its first line; one makes the models and ends
# normally, to show that the first would otherwise have given outputs, so that the test can tell the old rule from the new.
m <- fake_models(); saveRDS(m$p, file.path(dir, "p.rds")); saveRDS(m$d, file.path(dir, "d.rds"))
stand_in <- function(name, lines) { f <- file.path(dir, name); writeLines(lines, f); f }
models <- c(sprintf('primary_robust <- readRDS("%s")', file.path(dir, "p.rds")),
            sprintf('domain_robust <- readRDS("%s")', file.path(dir, "d.rds")), "df <- data.frame(year = c(1982, 2021))")
after <- stand_in("after.R", c(models, 'stop("a deliberate error after both models exist")'))
before <- stand_in("before.R", c('stop("a deliberate error at the first line")', models))
whole <- stand_in("whole.R", models)
tiny <- file.path(dir, "tiny.csv"); writeLines("year", tiny)
no_outputs <- function(status, res) status != 0 && !file.exists(file.path(res, "outputs.json"))
r <- file.path(dir, "r-whole"); status <- run(whole, tiny, r)
check(status == 0 && jsonlite::read_json(file.path(r, "outputs.json"))$mismatches == 0,
      "control: a stand-in script that makes both models and ends normally gives outputs")
r <- file.path(dir, "r-after"); check(no_outputs(run(after, tiny, r), r), "a script that stops after both models exist: no outputs")
r <- file.path(dir, "r-before"); check(no_outputs(run(before, tiny, r), r), "a script that stops before the models: no outputs")
r <- file.path(dir, "r-noseed"); check(no_outputs(run(whole, tiny, r, "ECDYSIS_SEED="), r), "no seed: no outputs")
r <- file.path(dir, "r-badseed"); check(no_outputs(run(whole, tiny, r, "ECDYSIS_SEED=not-hexadecimal"), r), "a seed that is not hexadecimal: no outputs")

# The authors' own script on synthetic data with known true effects and the clutter real files carry.
syn <- make_synthetic(dir); truth <- syn$truth; k <- syn$k; csv <- syn$csv
res <- file.path(dir, "results")
status <- run(script, csv, res)
check(status == 0, "run.R completes on the synthetic data (so the authors' script ran to its last line)")
out <- jsonlite::read_json(file.path(res, "outputs.json"))
check(identical(names(out), NAMES), "the 18 outputs and the period, by name")
check(out$k_primary == k && out$k_domain == k, sprintf("both models fitted on all %d synthetic effect sizes", k))
check(out$period_from == 19820101 && out$period_to == 20211231, "period from the synthetic years")
for (d in names(truth)) {
  key <- if (d == "pro-social") "prosocial" else d
  est <- out[[paste0("est_", key)]]; hw <- out[[paste0("hw_", key)]]
  check(abs(est - truth[[d]]) <= hw, sprintf("%s: true value %.2f inside the estimated interval (%.3f +/- %.3f)", d, truth[[d]], est, hw))
}
check(out$mismatches > 0 && out$mismatch_mask > 0, "synthetic data do not meet the published targets (the comparison can fail)")

# The independent implementation's values on these same synthetic data (independent/comparison.md; independent.py,
# re-run on 9 October 2026 for its full precision). The file's MD5 confirms they are the same data.
INDEPENDENT <- c(est_overall = 0.3750388288425047, hw_overall = 0.029258787605563875,
                 est_health = 0.2882535397574244, hw_health = 0.06870960811106769,
                 est_food = 0.6220432583632193, hw_food = 0.06162731118170906,
                 est_environment = 0.41683954885275054, hw_environment = 0.06543246619418967,
                 est_finance = 0.18352220524425034, hw_finance = 0.05985430088531581,
                 est_prosocial = 0.36554633398130065, hw_prosocial = 0.0640383211493267,
                 est_other = 0.39774330182748374, hw_other = 0.05080708743931519)
check(unname(tools::md5sum(csv)) == "3604fa484417997a9808614b3d98b43a", "the synthetic data are those the independent implementation used")
for (n in names(INDEPENDENT))
  check(abs(out[[n]] - INDEPENDENT[[n]]) <= 1e-8, sprintf("%s agrees with the independent implementation within 1e-8 (%.1e)",
                                                         n, abs(out[[n]] - INDEPENDENT[[n]])))

if (dir.exists("/keep")) file.copy(c(csv, file.path(res, "outputs.json")), "/keep", overwrite = TRUE)   # see test.sh

cat(if (failures == 0) "\nall tests passed\n" else sprintf("\n%d test(s) FAILED\n", failures))
quit(status = if (failures == 0) 0 else 1)
