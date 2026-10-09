# Reproduction check of Mertens et al. (2022), as corrected (claim ext:a6ba607cefd5f903; PLAN.md). Runs the authors'
# script, unchanged and checked by fingerprint, on their corrected data, then compares the seven figures with corrected
# Table 2 by the claim's test (compare.R) and writes results/outputs.json.
#
# Run from the checkout's root in rocker/tidyverse:4.1.2 (pinned in PLAN.md), sealed as the reference runner seals it:
#   Rscript research/receipts/mertens-2022-nudging/run.R
# Inputs are read at inputs/<name>. For tests only: Rscript run.R --test <script> <data> <results dir>, which skips the
# fingerprint check so that the script can be run on synthetic data.

here <- "research/receipts/mertens-2022-nudging"
source(file.path(here, "compare.R"))

args <- commandArgs(trailingOnly = TRUE)
testing <- length(args) >= 1 && args[1] == "--test"
script <- if (testing) args[2] else "inputs/mhhb_nma_analysis.R"
data <- if (testing) args[3] else "inputs/mhhb_nma_data_corrected.csv"
results <- if (testing) args[4] else "results"

# 0. The seed comes from ECDYSIS_SEED only: the run stops with no outputs if it is missing or not hexadecimal (the
# archive's seed is 64 hexadecimal characters). Checked first, before anything is installed or run.
seed <- Sys.getenv("ECDYSIS_SEED")
if (!grepl("^[0-9a-fA-F]+$", seed)) stop("ECDYSIS_SEED is missing or not hexadecimal; no outputs")

# 1. The inputs are the files the claim names. The runner has already checked their SHA-256 and size; R 4.1 has no
# SHA-256 of its own, so this repeats the check with MD5 (taken on 8 October 2026 from the verified downloads).
if (!testing) {
  want <- c("inputs/mhhb_nma_analysis.R" = "0a9cad7d91f9a3ed3f62c50da2c44111",
            "inputs/mhhb_nma_data_corrected.csv" = "a6fd0783103051714c39e28a68e1b1eb")
  got <- tools::md5sum(names(want))
  if (any(is.na(got)) || any(got != want)) stop("an input is not the file the claim names; no outputs")
}

# 2. metafor 3.0-2 (CRAN, 9 June 2021, current until 21 April 2022), the two packages it needs that the image lacks, and
# numDeriv, which metafor uses only if present and which the script's selmodel() calls require,
# from the bundle's vendor/ folder, into /tmp: the sealed machine has no network and a read-only root.
lib <- "/tmp/rlib"
dir.create(lib, showWarnings = FALSE)
install.packages(file.path(here, "vendor", c("mathjaxr_1.6-0.tar.gz", "pbapply_1.5-0.tar.gz", "numDeriv_2016.8-1.1.tar.gz",
                                       "metafor_3.0-2.tar.gz")),
                 lib = lib, repos = NULL, type = "source", quiet = TRUE)
.libPaths(c(lib, .libPaths()))
if (as.character(packageVersion("metafor", lib.loc = lib)) != "3.0.2") stop("metafor 3.0-2 did not install; no outputs")

# 3. Nothing in the parts of the script the test uses is random; the seed is set anyway, from ECDYSIS_SEED only.
set.seed(strtoi(substr(seed, 1, 7), 16L))

# 4. The script reads its data from its working directory by name, so it runs in a writable copy of that directory.
# View() opens a spreadsheet window, which a sealed machine has not got: here it does nothing. Plots go nowhere.
# The folder is emptied first, and must hold the one data file and nothing else once it is copied.
work <- "/tmp/work"
unlink(work, recursive = TRUE)
dir.create(work)
if (!file.copy(data, file.path(work, "mhhb_nma_data_corrected.csv"))) stop("could not copy the data; no outputs")
if (!identical(list.files(work, all.files = TRUE, no.. = TRUE), "mhhb_nma_data_corrected.csv"))
  stop("the work folder holds something other than the data; no outputs")
env <- new.env(parent = globalenv())
env$View <- function(...) invisible(NULL)
results <- normalizePath(results, mustWork = FALSE)
script <- normalizePath(script)
old <- setwd(work)
grDevices::pdf(NULL)

# 5. The whole script, from its first line to its last. Any error stops the run with no outputs, whether or not the
# two named models exist by then: the test says "inconclusive if the run stops" (amendment of 9 October 2026).
tryCatch(source(script, local = env, echo = FALSE), error = function(e)
  stop("the authors' script stopped: ", conditionMessage(e), "; no outputs", call. = FALSE))
setwd(old)
if (!exists("primary_robust", envir = env, inherits = FALSE) || !exists("domain_robust", envir = env, inherits = FALSE))
  stop("the script ended without fitting both named models; no outputs")

# 6. The publication years are checked, then the comparison, and the outputs. A figure that is not a finite number
# makes the run inconclusive: no outputs.
check_years(env$df$year)
x <- extract(env$primary_robust, env$domain_robust)
verdict <- judge(x)
if (verdict$outcome == "inconclusive") stop("a count or compared figure is not a finite number; no outputs")
out <- outputs(x, verdict, env$df$year)
dir.create(results, showWarnings = FALSE)
jsonlite::write_json(out, file.path(results, "outputs.json"), auto_unbox = TRUE, digits = NA)
message("done: ", length(out) - 2, " outputs, period outputs aside")
