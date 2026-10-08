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
set.seed(20261008)
truth <- c(health = 0.30, food = 0.60, environment = 0.45, finance = 0.20, "pro-social" = 0.40, other = 0.35)
n_pub <- 150
pubs <- data.frame(publication_id = seq_len(n_pub), domain = sample(names(truth), n_pub, TRUE),
                   u = rnorm(n_pub, 0, 0.15), year = sample(1982:2021, n_pub, TRUE), stringsAsFactors = FALSE)
pubs$year[1:2] <- c(1982, 2021)
rows <- do.call(rbind, lapply(seq_len(n_pub), function(p) {
  n <- sample(1:3, 1)
  data.frame(publication_id = p, study_in_pub = sample(1:2, n, TRUE))
}))
rows$study_id <- as.integer(factor(paste(rows$publication_id, rows$study_in_pub)))
rows$es_id <- seq_len(nrow(rows))
m <- match(rows$publication_id, pubs$publication_id)
techniques <- c("commitment", "composition", "consequence", "default", "effort", "reminder", "social_reference",
                "translation", "visibility")
category <- c(commitment = "assistance", reminder = "assistance", composition = "structure", consequence = "structure",
              default = "structure", effort = "structure", social_reference = "information", translation = "information",
              visibility = "information")
k <- nrow(rows)
syn <- data.frame(
  publication_id = rows$publication_id, study_id = rows$study_id, es_id = rows$es_id,
  reference = paste0("Author", rows$publication_id, ", A. (", pubs$year[m], ")"),
  title = paste0("\"A study, with a comma\" no. ", rows$publication_id),
  year = pubs$year[m], location = sample(0:1, k, TRUE), domain = pubs$domain[m],
  intervention_technique = rep_len(techniques, k), type_experiment = rep_len(c("artefactual_field",
    "conventional_lab", "framed_field", "natural_field"), k), population = sample(0:1, k, TRUE),
  n_study = sample(40:400, k, TRUE), stringsAsFactors = FALSE)
syn$intervention_category <- unname(category[syn$intervention_technique])
syn$n_comparison <- syn$n_study; syn$n_control <- syn$n_study %/% 2; syn$n_intervention <- syn$n_study - syn$n_control
syn$binary_outcome <- sample(0:1, k, TRUE)
syn$variance_d <- 4 / syn$n_study + (truth[syn$domain])^2 / (2 * syn$n_study)
syn$cohens_d <- truth[syn$domain] + pubs$u[m] + rnorm(k, 0, 0.1) + rnorm(k, 0, sqrt(syn$variance_d))
syn$mean_control <- ifelse(seq_len(k) %% 9 == 0, NA, round(runif(k, 1, 5), 2))
syn$sd_control <- ifelse(seq_len(k) %% 2 == 0, NA, round(runif(k, 0.5, 2), 2))
syn$mean_intervention <- syn$mean_control; syn$sd_intervention <- syn$sd_control
syn$approximation <- sample(0:1, k, TRUE)
cols <- c("publication_id", "study_id", "es_id", "reference", "title", "year", "location", "domain",
          "intervention_category", "intervention_technique", "type_experiment", "population", "n_study", "n_comparison",
          "n_control", "n_intervention", "binary_outcome", "mean_control", "sd_control", "mean_intervention",
          "sd_intervention", "cohens_d", "variance_d", "approximation")
syn <- syn[, cols]
syn$variance_d <- ifelse(seq_len(k) %% 25 == 0, formatC(syn$variance_d, format = "E", digits = 6),   # some in E notation,
                          formatC(syn$variance_d, format = "f", digits = 8))                # as in the real file
dir <- tempfile("synthetic"); dir.create(dir)
csv <- file.path(dir, "data.csv")
con <- file(csv, "wb")                                                           # byte-order mark and CRLF, as Excel writes
writeBin(as.raw(c(0xef, 0xbb, 0xbf)), con)
txt <- capture.output(write.csv(syn, row.names = FALSE, na = "NA", quote = TRUE))
writeBin(charToRaw(paste0(paste(txt, collapse = "\r\n"), "\r\n")), con)
close(con)
file.create(file.path(dir, ".DS_Store"))                                          # clutter beside the file, never read

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

cat(if (failures == 0) "\nall tests passed\n" else sprintf("\n%d test(s) FAILED\n", failures))
quit(status = if (failures == 0) 0 else 1)
