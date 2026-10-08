#!/usr/bin/env python3
import argparse
import csv
import json
import math

import numpy as np
from scipy import linalg, optimize, stats


DOMAINS = (
    "health", "food", "environment", "finance", "pro-social", "other"
)
FIGURES = (
    "health", "food", "environment", "finance", "prosocial", "other"
)


def text(value):
    if value is None:
        return None
    value = value.strip()
    return None if value in ("", "NA") else value


def number(value):
    value = text(value)
    if value is None:
        return np.nan
    result = float(value)
    if not math.isfinite(result):
        raise ValueError("Non-finite numeric input: " + value)
    return result


def read_data(path):
    required = {
        "publication_id", "study_id", "es_id", "year", "domain",
        "cohens_d", "variance_d",
    }
    rows = []
    with open(path, "r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not required.issubset(reader.fieldnames or []):
            raise ValueError("CSV is missing required columns")
        for row in reader:
            rows.append({
                "publication": text(row["publication_id"]),
                "study": text(row["study_id"]),
                "effect": text(row["es_id"]),
                "year": number(row["year"]),
                "domain": text(row["domain"]),
                "y": number(row["cohens_d"]),
                "v": number(row["variance_d"]),
            })
    return rows


def encode_groups(keys):
    mapping = {}
    codes = np.empty(len(keys), dtype=np.int64)
    for i, key in enumerate(keys):
        if key not in mapping:
            mapping[key] = len(mapping)
        codes[i] = mapping[key]
    return codes, len(mapping)


def aggregate(values, codes, count):
    values = np.asarray(values)
    result = np.zeros((count,) + values.shape[1:], dtype=float)
    np.add.at(result, codes, values)
    return result


class NestedREML:
    """REML for V = diag(v) + a Z_publication Z_publication'
                               + b Z_nested_effect Z_nested_effect'."""

    def __init__(self, y, v, X, publication, effect):
        self.y = np.asarray(y, dtype=float)
        self.v = np.asarray(v, dtype=float)
        self.X = np.asarray(X, dtype=float)
        self.k, self.p = self.X.shape

        if self.k <= self.p:
            raise ValueError("Insufficient observations for REML")
        if np.any(self.v <= 0):
            raise ValueError("This implementation requires positive variances")
        if np.linalg.matrix_rank(self.X) != self.p:
            raise ValueError("The moderator matrix is rank deficient")

        self.pub, self.npub = encode_groups(publication)
        self.es, self.nes = encode_groups(
            list(zip(publication, effect))
        )
        self.es_pub = np.empty(self.nes, dtype=np.int64)
        self.es_pub[self.es] = self.pub

        self.d = 1.0 / self.v
        self.S = aggregate(self.d, self.es, self.nes)
        self.logdet_D = float(np.log(self.v).sum())

        # Apply V^-1 to X and y together.
        self.A = np.column_stack((self.X, self.y))
        self.DA = self.d[:, None] * self.A
        self.es_DA = aggregate(self.DA, self.es, self.nes)

        self.parameter_scale = max(
            float(np.var(self.y, ddof=1)),
            float(np.median(self.v)),
            1e-8,
        )

    def evaluate(self, theta, gradient=True):
        a, b = np.asarray(theta, dtype=float) * self.parameter_scale
        if a < 0 or b < 0:
            raise ValueError("Negative variance component")

        # First invert diag(v) + b Z_es Z_es', then add the
        # publication-level rank-one terms.
        denominator_es = 1.0 + b * self.S
        c_es = b / denominator_es
        h_es_base = self.S / denominator_es

        BA = (
            self.DA
            - self.d[:, None]
            * c_es[self.es, None]
            * self.es_DA[self.es]
        )

        h_pub_base = aggregate(h_es_base, self.es_pub, self.npub)
        denominator_pub = 1.0 + a * h_pub_base
        c_pub = a / denominator_pub

        pub_BA = aggregate(BA, self.pub, self.npub)
        B_one = self.d / denominator_es[self.es]
        WA = (
            BA
            - B_one[:, None]
            * c_pub[self.pub, None]
            * pub_BA[self.pub]
        )

        WX = WA[:, :self.p]
        Wy = WA[:, self.p]
        H = self.X.T @ WX
        H = (H + H.T) / 2.0

        chol = linalg.cho_factor(H, lower=True, check_finite=False)
        bread = linalg.cho_solve(
            chol, np.eye(self.p), check_finite=False
        )
        beta = linalg.cho_solve(
            chol, self.X.T @ Wy, check_finite=False
        )

        residual = self.y - self.X @ beta
        weighted_residual = Wy - WX @ beta
        quadratic = float(residual @ weighted_residual)

        logdet_V = (
            self.logdet_D
            + float(np.log1p(b * self.S).sum())
            + float(np.log1p(a * h_pub_base).sum())
        )
        logdet_H = 2.0 * float(np.log(np.diag(chol[0])).sum())

        # Constants independent of the variance components are omitted.
        objective = 0.5 * (logdet_V + logdet_H + quadratic)

        result = {
            "objective": objective,
            "beta": beta,
            "bread": bread,
            "WX": WX,
            "residual": residual,
        }

        if gradient:
            pub_WX = aggregate(WX, self.pub, self.npub)
            es_WX = aggregate(WX, self.es, self.nes)
            pub_r = aggregate(weighted_residual, self.pub, self.npub)
            es_r = aggregate(weighted_residual, self.es, self.nes)

            trace_Vinv_pub = float(
                (h_pub_base / denominator_pub).sum()
            )
            trace_Vinv_es = float(
                (
                    h_es_base
                    - c_pub[self.es_pub] * h_es_base**2
                ).sum()
            )

            trace_P_pub = trace_Vinv_pub - float(
                np.sum((pub_WX @ bread) * pub_WX)
            )
            trace_P_es = trace_Vinv_es - float(
                np.sum((es_WX @ bread) * es_WX)
            )

            result["gradient"] = (
                0.5
                * self.parameter_scale
                * np.array([
                    trace_P_pub - float(pub_r @ pub_r),
                    trace_P_es - float(es_r @ es_r),
                ])
            )

        return result

    def fit(self):
        def objective(theta):
            result = self.evaluate(theta)
            return result["objective"], result["gradient"]

        candidates = []

        def retain(theta):
            theta = np.maximum(np.asarray(theta, dtype=float), 0.0)
            result = self.evaluate(theta, gradient=False)
            if math.isfinite(result["objective"]):
                candidates.append((result["objective"], theta.copy()))

        # Deterministic multistart optimization, including boundary starts.
        starts = (
            (0.0, 0.0), (0.5, 0.5), (1.0, 0.0),
            (0.0, 1.0), (2.0, 2.0),
        )
        for start in starts:
            fit = optimize.minimize(
                objective,
                np.array(start),
                method="L-BFGS-B",
                jac=True,
                bounds=((0.0, None), (0.0, None)),
                options={
                    "maxiter": 2000,
                    "maxls": 100,
                    "ftol": 1e-14,
                    "gtol": 1e-8,
                },
            )
            retain(fit.x)

        # Explicitly optimize both boundary models, not merely the interior.
        for free_index in (0, 1):
            for start in (0.0, 0.5, 2.0):
                def edge_objective(z, index=free_index):
                    theta = np.zeros(2)
                    theta[index] = z[0]
                    value, grad = objective(theta)
                    return value, np.array([grad[index]])

                fit = optimize.minimize(
                    edge_objective,
                    np.array([start]),
                    method="L-BFGS-B",
                    jac=True,
                    bounds=((0.0, None),),
                    options={
                        "maxiter": 2000,
                        "maxls": 100,
                        "ftol": 1e-14,
                        "gtol": 1e-8,
                    },
                )
                theta = np.zeros(2)
                theta[free_index] = fit.x[0]
                retain(theta)

        retain((0.0, 0.0))
        _, theta = min(candidates, key=lambda candidate: candidate[0])
        result = self.evaluate(theta, gradient=False)
        result["sigma2"] = theta * self.parameter_scale
        return result


def cluster_robust(fit, studies, p):
    cluster, ncluster = encode_groups(studies)
    if ncluster <= p:
        raise ValueError(
            "Cluster-robust inference requires more clusters than coefficients"
        )

    # X' V^-1 times each cluster's residual vector.
    scores = aggregate(
        fit["WX"] * fit["residual"][:, None],
        cluster,
        ncluster,
    )
    meat = scores.T @ scores
    bread = fit["bread"]

    # metafor's default adjust=TRUE correction.
    covariance = (
        ncluster / (ncluster - p)
    ) * (bread @ meat @ bread)
    covariance = (covariance + covariance.T) / 2.0

    diagonal = np.diag(covariance)
    if np.any(diagonal < -1e-10):
        raise ArithmeticError("Negative robust coefficient variance")
    se = np.sqrt(np.maximum(diagonal, 0.0))
    critical = stats.t.ppf(0.975, df=ncluster - p)
    return fit["beta"], critical * se


def fit_model(rows, X):
    for row in rows:
        if (
            row["publication"] is None
            or row["effect"] is None
            or row["study"] is None
        ):
            raise ValueError("Missing grouping or clustering identifier")

    model = NestedREML(
        [row["y"] for row in rows],
        [row["v"] for row in rows],
        X,
        [row["publication"] for row in rows],
        [row["effect"] for row in rows],
    )
    fit = model.fit()
    beta, half_width = cluster_robust(
        fit, [row["study"] for row in rows], X.shape[1]
    )
    return fit, beta, half_width


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path")
    parser.add_argument("json_path")
    args = parser.parse_args()

    rows = read_data(args.csv_path)

    primary_rows = [
        row for row in rows
        if not np.isnan(row["y"]) and not np.isnan(row["v"])
    ]
    if not primary_rows:
        raise ValueError("No observations available for the primary model")

    primary_X = np.ones((len(primary_rows), 1))
    primary_fit, primary_beta, primary_hw = fit_model(
        primary_rows, primary_X
    )

    # R's scale(year) is evaluated before model-specific NA omission.
    years = np.array([
        row["year"] for row in rows if not np.isnan(row["year"])
    ])
    if len(years) < 2:
        raise ValueError("Insufficient nonmissing publication years")
    year_mean = float(years.mean())
    year_sd = float(years.std(ddof=1))
    if year_sd <= 0:
        raise ValueError("Publication year has zero variance")

    domain_rows = [
        row for row in primary_rows
        if row["domain"] is not None and not np.isnan(row["year"])
    ]
    if any(row["domain"] not in DOMAINS for row in domain_rows):
        raise ValueError("Unrecognized domain label")
    if set(row["domain"] for row in domain_rows) != set(DOMAINS):
        raise ValueError("All six domains must be present")

    domain_X = np.zeros((len(domain_rows), len(DOMAINS) + 1))
    domain_index = {name: i for i, name in enumerate(DOMAINS)}
    for i, row in enumerate(domain_rows):
        domain_X[i, domain_index[row["domain"]]] = 1.0
        domain_X[i, -1] = (row["year"] - year_mean) / year_sd

    _, domain_beta, domain_hw = fit_model(domain_rows, domain_X)

    output = {
        "k_primary": len(primary_rows),
        "k_domain": len(domain_rows),
        "est_overall": float(primary_beta[0]),
        "hw_overall": float(primary_hw[0]),
        "sigma2_primary": [
            float(value) for value in primary_fit["sigma2"]
        ],
    }
    for i, figure in enumerate(FIGURES):
        output["est_" + figure] = float(domain_beta[i])
        output["hw_" + figure] = float(domain_hw[i])

    with open(args.json_path, "w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2, allow_nan=False)
        handle.write("\n")


if __name__ == "__main__":
    main()
