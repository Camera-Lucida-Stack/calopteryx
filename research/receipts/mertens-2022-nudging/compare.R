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

# Rounds half away from zero, as the test says (R's round() rounds half to even), applied to the value exactly as
# computed, with no tolerance (amendment of 9 October 2026). floor(abs(x) * 100 + 0.5) is not exact, because the
# multiplication itself rounds (0.145 is stored as 0.14499999..., but 0.145 * 100 gives 14.5000...), so the stored value
# is written out in full instead: glibc's printf gives a double's exact decimal expansion, and 1,100 places hold every
# double's. The digits up to the second decimal are kept, and one is added in the last place if the next digit is 5 or
# more; the result is read back from its decimal digits, as R reads the targets.
round_half_away <- function(x, digits = 2) {
  up_one <- function(s) {                       # adds one in the last place of a string of digits with a point
    ch <- strsplit(s, "", fixed = TRUE)[[1]]
    for (i in rev(seq_along(ch))) {
      if (ch[i] == ".") next
      if (ch[i] != "9") { ch[i] <- as.character(as.integer(ch[i]) + 1L); return(paste(ch, collapse = "")) }
      ch[i] <- "0"
    }
    paste0("1", paste(ch, collapse = ""))
  }
  vapply(x, function(v) {
    if (!is.finite(v)) return(v)
    s <- sprintf("%.1100f", abs(v))
    point <- regexpr(".", s, fixed = TRUE)
    kept <- substr(s, 1, point + digits)
    if (as.integer(substr(s, point + digits + 1, point + digits + 1)) >= 5) kept <- up_one(kept)
    sign(v) * as.numeric(kept)
  }, numeric(1), USE.NAMES = FALSE)
}

# The seven figures: estimate and 95% CI limits, unrounded, from the two named models. Rows are found by name, so a
# changed coefficient name stops the run instead of comparing the wrong row.
extract <- function(primary_robust, domain_robust) {
  rows <- lapply(seq_len(nrow(TARGETS)), function(i) {
    m <- if (i == 1) primary_robust else domain_robust
    names <- rownames(m$beta)
    j <- match(TARGETS$coef[i], names)
    if (is.na(j)) stop(sprintf("coefficient %s not found (have: %s)", TARGETS$coef[i], paste(names, collapse = ", ")))
    one <- function(v) if (is.numeric(v) && length(v) == 1) unname(v) else NA_real_   # absent: not a finite figure
    c(est = one(m$beta[j, 1]), lb = one(m$ci.lb[j]), ub = one(m$ci.ub[j]))
  })
  list(k_primary = primary_robust$k, k_domain = domain_robust$k, figures = do.call(rbind, rows))
}

# The outcome rule. Inconclusive when a count or a compared figure is not a finite number (a count must be present,
# numeric and a single value); otherwise refuted ("failed" on Ecdysis) when either k differs from 447 or any of the 21
# compared numbers differs after rounding; otherwise confirmed. mismatched marks which of the 21 differ: the seven
# estimates, then the seven lower limits, then the seven upper limits, each in Table 2's order.
judge <- function(x) {
  f <- x$figures
  count_ok <- function(k) is.numeric(k) && length(k) == 1 && is.finite(k)
  finite <- count_ok(x$k_primary) && count_ok(x$k_domain) && all(is.finite(f))
  mismatched <- if (finite) c(round_half_away(f[, "est"]) != TARGETS$est, round_half_away(f[, "lb"]) != TARGETS$lb,
                              round_half_away(f[, "ub"]) != TARGETS$ub) else NA
  mismatches <- if (finite) sum(mismatched) else NA
  outcome <- if (!finite) "inconclusive" else if (x$k_primary != K || x$k_domain != K || mismatches > 0) "failed" else "confirmed"
  list(outcome = outcome, mismatches = mismatches, mismatched = mismatched)
}

# The publication years, checked before they give the period (amendment of 9 October 2026): every year must be present,
# finite, a whole number and within 1900 to 2100, a plain sanity range; otherwise the run stops with no outputs. A span
# other than 1982 to 2021 does not stop the run: the outcome is still judged by the test, and the difference is put to
# the operator before anything is filed (PLAN.md).
check_years <- function(years) {
  if (!is.numeric(years) || length(years) == 0 || any(!is.finite(years)) || any(years != floor(years)) ||
      any(years < 1900 | years > 2100))
    stop("a publication year is missing, not a whole number or outside 1900-2100; no outputs")
  invisible(TRUE)
}

# At most 20 outputs (period_from and period_to are not counted): the two counts, each figure's estimate and the
# half-width of its interval (robust() gives b +/- t * se, so the interval is symmetric), the number of mismatches, and
# mismatch_mask, whose bit i (worth 2^(i-1)) is set when the i-th of the 21 compared numbers differs, in the order of
# judge()'s mismatched.
outputs <- function(x, verdict, years) {
  check_years(years)
  f <- x$figures
  out <- list(k_primary = x$k_primary, k_domain = x$k_domain)
  for (i in seq_len(nrow(TARGETS))) {
    out[[paste0("est_", TARGETS$figure[i])]] <- unname(f[i, "est"])
    out[[paste0("hw_", TARGETS$figure[i])]] <- unname((f[i, "ub"] - f[i, "lb"]) / 2)
  }
  out$mismatches <- verdict$mismatches
  out$mismatch_mask <- as.integer(sum(2^(which(verdict$mismatched) - 1)))
  out$period_from <- as.integer(min(years) * 10000 + 101)
  out$period_to <- as.integer(max(years) * 10000 + 1231)
  out
}
