# The claim's test, as code (ext:a6ba607cefd5f903; PLAN.md). Kept apart from run.R so that test_run.R can exercise it on
# made-up model objects without running any analysis. Base R only.

# Corrected Table 2 (PNAS 119(19), e2204059119), as the claim's test copies it. coef: the row of domain_robust's
# coefficients holding that domain's estimate (the model has no intercept; labels are the data's own).
TARGETS <- data.frame(
  figure = c("overall", "health", "food", "environment", "finance", "prosocial", "other"),
  coef   = c("intrcpt", "factor(domain)health", "factor(domain)food", "factor(domain)environment",
             "factor(domain)finance", "factor(domain)pro-social", "factor(domain)other"),
  est    = c(0.43, 0.34, 0.65, 0.43, 0.24, 0.41, 0.31),
  lb     = c(0.38, 0.25, 0.47, 0.33, 0.14, 0.27, 0.09),
  ub     = c(0.48, 0.43, 0.83, 0.54, 0.35, 0.54, 0.52),
  stringsAsFactors = FALSE)
K <- 447

# Rounds half away from zero, as the test says (R's round() rounds half to even). The 1e-9 is added after scaling,
# so a value within about 1e-11 of a tie, where binary storage may have put it a hair below, rounds as the tie.
round_half_away <- function(x, digits = 2) {
  m <- 10^digits
  sign(x) * floor(abs(x) * m + 0.5 + 1e-9) / m
}

# The seven figures: estimate and 95% CI limits, unrounded, from the two named models. Rows are found by name, so a
# changed coefficient name stops the run instead of comparing the wrong row.
extract <- function(primary_robust, domain_robust) {
  rows <- lapply(seq_len(nrow(TARGETS)), function(i) {
    m <- if (i == 1) primary_robust else domain_robust
    names <- rownames(m$beta)
    j <- match(TARGETS$coef[i], names)
    if (is.na(j)) stop(sprintf("coefficient %s not found (have: %s)", TARGETS$coef[i], paste(names, collapse = ", ")))
    c(est = unname(m$beta[j, 1]), lb = unname(m$ci.lb[j]), ub = unname(m$ci.ub[j]))
  })
  list(k_primary = primary_robust$k, k_domain = domain_robust$k, figures = do.call(rbind, rows))
}

# The outcome rule. Inconclusive when a count or a compared figure is not a finite number; otherwise refuted
# ("failed" on Ecdysis) when either k differs from 447 or any of the 21 compared numbers differs after rounding;
# otherwise confirmed.
judge <- function(x) {
  f <- x$figures
  finite <- all(is.finite(c(x$k_primary, x$k_domain, f)))
  mismatches <- if (finite) sum(round_half_away(f[, "est"]) != TARGETS$est) +
                            sum(round_half_away(f[, "lb"]) != TARGETS$lb) +
                            sum(round_half_away(f[, "ub"]) != TARGETS$ub) else NA
  outcome <- if (!finite) "inconclusive" else if (x$k_primary != K || x$k_domain != K || mismatches > 0) "failed" else "confirmed"
  list(outcome = outcome, mismatches = mismatches)
}

# At most 20 outputs (period_from and period_to are not counted): the two counts, each figure's estimate and the
# half-width of its interval (robust() gives b +/- t * se, so the interval is symmetric), the number of mismatches,
# and whether the authors' script ran to its end.
outputs <- function(x, verdict, completed, years) {
  f <- x$figures
  out <- list(k_primary = x$k_primary, k_domain = x$k_domain)
  for (i in seq_len(nrow(TARGETS))) {
    out[[paste0("est_", TARGETS$figure[i])]] <- unname(f[i, "est"])
    out[[paste0("hw_", TARGETS$figure[i])]] <- unname((f[i, "ub"] - f[i, "lb"]) / 2)
  }
  out$mismatches <- verdict$mismatches
  out$script_completed <- as.integer(completed)
  out$period_from <- as.integer(min(years) * 10000 + 101)
  out$period_to <- as.integer(max(years) * 10000 + 1231)
  out
}
