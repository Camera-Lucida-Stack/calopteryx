# Synthetic data for test_run.R: the columns of mhhb_nma_data_corrected.csv, with known true effects by domain and the
# clutter real files carry (byte-order mark, CRLF line ends, quoted commas, NA tokens, some values in E notation, a
# hidden file beside the data). make_synthetic(dir) writes dir/data.csv and returns the truth and the number of rows.
make_synthetic <- function(dir) {
  set.seed(20261008)
  truth <- c(health = 0.30, food = 0.60, environment = 0.45, finance = 0.20, "pro-social" = 0.40, other = 0.35)
  n_pub <- 212                       # the real file's 212 publications and 447 rows: the script's forest plot
  pubs <- data.frame(publication_id = seq_len(n_pub), domain = sample(names(truth), n_pub, TRUE),   # assumes 447 rows
                     u = rnorm(n_pub, 0, 0.15), year = sample(1982:2021, n_pub, TRUE), stringsAsFactors = FALSE)
  pubs$year[1:2] <- c(1982, 2021)
  per_pub <- 1 + tabulate(sample(n_pub, 447 - n_pub, TRUE), n_pub)
  rows <- data.frame(publication_id = rep(seq_len(n_pub), per_pub))
  rows$study_in_pub <- sample(1:2, nrow(rows), TRUE)
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
  csv <- file.path(dir, "data.csv")
  con <- file(csv, "wb")                                                           # byte-order mark and CRLF, as Excel writes
  writeBin(as.raw(c(0xef, 0xbb, 0xbf)), con)
  txt <- capture.output(write.csv(syn, row.names = FALSE, na = "NA", quote = TRUE))
  writeBin(charToRaw(paste0(paste(txt, collapse = "\r\n"), "\r\n")), con)
  close(con)
  file.create(file.path(dir, ".DS_Store"))                                          # clutter beside the file, never read

  list(truth = truth, k = k, csv = csv)
}
