"""Pennycook et al. (2021) reproduction check on the authors' own data (see PLAN.md).

Follows the authors' Stata code (Study_3_and_4_code.do lines 1-79 and 121, 134; Study_5_code.do lines 1-44 and 86) and
the clustering command it calls (Petersen's cluster2.ado), and writes results/outputs.json: numbers only, never a
participant's data. Reads inputs/Study_3_data.csv, Study_4_data.csv and Study_5_data.csv (inputs/0.1, verified by the
runner); the two .do files are inputs too, as the claim's data of record, and are only checked to be present. No
randomness and no clock: ECDYSIS_SEED is not needed. Standard library only, plus research/lib/tidy.py.

Each study's model is ordinary least squares of sharing intention, rescaled from 1-6 to 0-1, on condition, headline
veracity and their interaction, among participants who say they sometimes share political content (socialmedia_chk==1),
after dropping those who did not finish (socialmedia_chk missing) or do not use Facebook (fb==2). Standard errors are
cluster2's: V = V(participant) + V(headline) - V(robust), each with Stata's small-sample factor, (N-1)/(N-K) * G/(G-1)
for a clustered variance and N/(N-K) for the robust one (cluster2 uses the robust variance when every participant-
headline pair occurs once, as here by construction).
"""
import csv
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
from tidy import Exclusions, at_most  # noqa: E402

INPUTS = os.environ.get("CX_INPUTS", "inputs")
RESULTS = os.environ.get("CX_RESULTS", "results")
CODE_FILES = ["Study_3_and_4_code.do", "Study_5_code.do"]

# The claim's test (ext:c9c5c670f8aa1b81): Supplementary Tables S2 (columns 1-2) and S4 (column 2).
TARGETS = {
    "s3": {"b": 0.0529, "se": 0.0108, "n_obs": 17417, "n_participants": 727, "n_headlines": 24},
    "s4": {"b": 0.0648, "se": 0.0147, "n_obs": 18677, "n_participants": 780, "n_headlines": 24},
    "s5": {"b": 0.0542, "se": 0.0157, "n_obs": 13340, "n_participants": 671, "n_headlines": 20},
}
B_TOLERANCE = 0.0001   # the estimate may differ from the published value by at most this
SE_TOLERANCE = 0.05    # the SE may differ from the published value by at most this share of it


def number(text, exclusions, column):
    """Stata's destring: blank is missing; text that is not a number is missing too, and counted."""
    s = text.strip()
    if s == "":
        return None
    try:
        x = float(s)
    except ValueError:
        exclusions.add(f"unreadable cell in {column}")
        return None
    return x if math.isfinite(x) else None


def us_date(text):
    """'10/4/2017 10:00' or '11/29/2017' as the integer 20171004; None if absent or unreadable."""
    s = text.strip().split(" ")[0]
    parts = s.split("/")
    if len(parts) != 3:
        return None
    try:
        m, d, y = (int(p) for p in parts)
    except ValueError:
        return None
    if not (1 <= m <= 12 and 1 <= d <= 31 and 2000 <= y <= 2100):
        return None
    return y * 10000 + m * 100 + d


def read(name):
    """Rows as dicts keyed by lower-case column names (Stata's insheet lower-cases them)."""
    with open(os.path.join(INPUTS, name), encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    header = [h.strip().lower() for h in rows[0]]
    if len(set(header)) != len(header):
        raise SystemExit(f"{name}: repeated column names")
    return [dict(zip(header, r)) for r in rows[1:] if any(c.strip() for c in r)], header


def observations(name, items, regressors, exclusions):
    """One observation per participant, headline and veracity: (x, y, participant, headline), plus dates seen."""
    rows, header = read(name)
    start = "startdate" if "startdate" in header else "v8"     # Study 3 has Qualtrics' older V8/V9 columns
    end = "enddate" if "enddate" in header else "v9"
    for c in ["condition", "fb", "socialmedia_chk", start, end]:
        if c not in header:
            raise SystemExit(f"{name}: no column {c}")
    obs, dates = [], []
    for pid, row in enumerate(rows):
        chk = number(row["socialmedia_chk"], exclusions, "socialmedia_chk")
        if chk is None:
            exclusions.add(f"{name}: participant did not finish")
            continue
        if number(row["fb"], exclusions, "fb") == 2:
            exclusions.add(f"{name}: participant does not use Facebook")
            continue
        if chk != 1:
            exclusions.add(f"{name}: participant does not share political content")
            continue
        cond = number(row["condition"], exclusions, "condition")
        kept = 0
        for real in (0, 1):
            for i in range(1, items + 1):
                col = f"{'real' if real else 'fake'}{i}_3"
                if col not in header:
                    raise SystemExit(f"{name}: no column {col}")
                v = number(row[col], exclusions, col)
                if v is None:
                    exclusions.add(f"{name}: no sharing answer")
                    continue
                x = regressors(cond, real)
                if x is None:
                    exclusions.add(f"{name}: condition missing or unknown")
                    continue
                obs.append((x, (v - 1) / 5, pid, (real, i)))
                kept += 1
        if kept:
            dates.append((us_date(row[start]), us_date(row[end])))
    return obs, dates


def s34(cond, real):
    """xi: i.condition*real, condition 1 Control and 2 Treatment: constant, Treatment, veracity, Treatment x veracity."""
    if cond not in (1, 2):
        return None
    t = cond - 1
    return [1.0, t, real, t * real]


def s5(cond, real):
    """xi: i.treatment*real i.importance*real, against the pooled passive and active controls (conditions 1 and 2)."""
    if cond not in (1, 2, 3, 4):
        return None
    t, m = float(cond == 3), float(cond == 4)
    return [1.0, t, real, t * real, m, m * real]


def inverse(a):
    """Gauss-Jordan inverse with partial pivoting, for the small symmetric matrices here."""
    n = len(a)
    m = [list(map(float, row)) + [float(i == j) for j in range(n)] for i, row in enumerate(a)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(m[r][c]))
        if abs(m[p][c]) < 1e-12:
            raise SystemExit("the model's regressors are collinear")
        m[c], m[p] = m[p], m[c]
        piv = m[c][c]
        m[c] = [v / piv for v in m[c]]
        for r in range(n):
            if r != c and m[r][c] != 0:
                f = m[r][c]
                m[r] = [vr - f * vc for vr, vc in zip(m[r], m[c])]
    return [row[n:] for row in m]


def sandwich(a, meat, q):
    k = len(a)
    am = [[math.fsum(a[i][l] * meat[l][j] for l in range(k)) for j in range(k)] for i in range(k)]
    return [[q * math.fsum(am[i][l] * a[l][j] for l in range(k)) for j in range(k)] for i in range(k)]


def outer_sum(vectors, k):
    return [[math.fsum(v[i] * v[j] for v in vectors) for j in range(k)] for i in range(k)]


def cluster2(obs):
    """OLS with cluster2's two-way clustered variance. Returns (b, se, n, participants, headlines)."""
    k, n = len(obs[0][0]), len(obs)
    xtx = [[math.fsum(o[0][i] * o[0][j] for o in obs) for j in range(k)] for i in range(k)]
    xty = [math.fsum(o[0][i] * o[1] for o in obs) for i in range(k)]
    a = inverse(xtx)
    b = [math.fsum(a[i][j] * xty[j] for j in range(k)) for i in range(k)]
    scores = [[xi * (o[1] - math.fsum(bj * xj for bj, xj in zip(b, o[0]))) for xi in o[0]] for o in obs]

    def clustered(key):
        groups = {}
        for o, s in zip(obs, scores):
            g = groups.setdefault(key(o), [0.0] * k)
            for i in range(k):
                g[i] += s[i]
        G = len(groups)
        return sandwich(a, outer_sum(groups.values(), k), (n - 1) / (n - k) * G / (G - 1)), G

    v_id, n_id = clustered(lambda o: o[2])
    v_item, n_item = clustered(lambda o: o[3])
    if len({(o[2], o[3]) for o in obs}) != n:
        raise SystemExit("a participant-headline pair occurs twice; cluster2 would cluster on the pair")
    v_rob = sandwich(a, outer_sum(scores, k), n / (n - k))
    v = [[v_id[i][j] + v_item[i][j] - v_rob[i][j] for j in range(k)] for i in range(k)]
    se = [math.sqrt(v[i][i]) if v[i][i] > 0 else float("nan") for i in range(k)]
    return b, se, n, n_id, n_item


def main():
    for f in CODE_FILES:
        if not os.path.exists(os.path.join(INPUTS, f)):
            raise SystemExit(f"input missing: {f}")
    ex = Exclusions()
    out, dates, met = {}, [], 0
    for study, name, items, model in [("s3", "Study_3_data.csv", 12, s34), ("s4", "Study_4_data.csv", 12, s34),
                                      ("s5", "Study_5_data.csv", 10, s5)]:
        obs, d = observations(name, items, model, ex)
        dates += d
        b, se, n, n_id, n_item = cluster2(obs)
        got = {"b": b[3], "se": se[3], "n_obs": n, "n_participants": n_id, "n_headlines": n_item}
        out[f"{study}_b_txv"] = round(b[3], 10)
        out[f"{study}_se_txv"] = round(se[3], 10)
        out[f"{study}_n_obs"] = n
        out[f"{study}_n_participants"] = n_id
        out[f"{study}_n_headlines"] = n_item
        t = TARGETS[study]
        met += at_most(abs(got["b"] - t["b"]), B_TOLERANCE)
        met += at_most(abs(got["se"] / t["se"] - 1), SE_TOLERANCE)
        met += sum(got[c] == t[c] for c in ("n_obs", "n_participants", "n_headlines"))
    out["targets_met"] = met
    out["n_unreadable_cells"] = sum(v for r, v in ex.counts.items() if r.startswith("unreadable cell"))
    starts = [s for s, _ in dates if s is not None]
    ends = [e for _, e in dates if e is not None]
    out["period_from"], out["period_to"] = min(starts), max(ends)
    os.makedirs(RESULTS, exist_ok=True)
    with open(os.path.join(RESULTS, "outputs.json"), "w") as f:
        json.dump(out, f, indent=1, sort_keys=True)
    print(json.dumps({"exclusions": ex.report(), "undated participants": len(dates) - min(len(starts), len(ends))},
                     indent=1), file=sys.stderr)


if __name__ == "__main__":
    main()
