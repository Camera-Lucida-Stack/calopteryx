"""Tests of run.py on synthetic files shaped like the authors' CSVs and carrying their clutter (PLAYBOOK.md, Lesson 3).

The estimates and standard errors are compared with an independent implementation: statsmodels' OLS with its own
clustered (Stata-style small-sample factors) and HC1 variances, combined as cluster2 combines them. statsmodels is used
only here, never in the bundle; without it those comparisons are skipped and the rest still run.
"""
import csv
import importlib.util
import json
import os
import random
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("run", os.path.join(HERE, "run.py"))
run = importlib.util.module_from_spec(spec)
spec.loader.exec_module(run)

try:
    import numpy as np
    import statsmodels.api as sm
except ImportError:  # the independent check needs them; the bundle never does
    sm = None


def write_study(path, items, conditions, n, rng, dates, old_qualtrics=False, bom=True, crlf=True):
    """A wide file, one row per participant, with the real files' clutter. Returns the expected clean observations."""
    head = (["V1", "V8", "V9"] if old_qualtrics else ["ResponseID", "StartDate", "EndDate", "Email"]) + \
        ["Condition", "FB", "SocialMedia_Chk", "Zipcode"]
    for kind in ("Fake", "Real"):
        for i in range(1, items + 1):
            head += [f"{kind}{i}_SM", f"{kind}{i}_3", f"{kind}{i}_RT_3"]     # _SM and _RT_3 must be ignored
    rows, expected = [], []
    for p in range(n):
        cond = rng.choice(conditions)
        fb = rng.choice(["1"] * 9 + ["2"])
        chk = rng.choice(["1"] * 6 + ["2", "3", " ", ""])
        d = rng.choice(dates)
        row = {"V1": f"R{p}", "ResponseID": f"R{p}", "Email": " ", "Zipcode": str(rng.randint(10000, 99999)),
               "V8": f"{d} 10:{p % 60:02d}", "V9": f"{d} 11:00", "StartDate": d, "EndDate": d,
               "Condition": cond if rng.random() > 0.03 else " ", "FB": fb, "SocialMedia_Chk": chk}
        effect = 0.3 if cond in ("2", "3") else 0.0
        for kind in ("Fake", "Real"):
            real = int(kind == "Real")
            for i in range(1, items + 1):
                v = min(6, max(1, round(2 + 1.2 * real + effect * real - 0.4 * (cond in ("2", "3")) * (1 - real)
                                        + rng.gauss(0, 1.3) + 0.2 * (i % 3))))
                cell = str(v)
                r = rng.random()
                if r < 0.04:
                    cell = rng.choice([" ", ""])
                elif r < 0.045:
                    cell = "n/a"                       # text in a number column: missing, and counted
                row[f"{kind}{i}_3"] = cell
                row[f"{kind}{i}_SM"] = str(rng.randint(1, 6))
                row[f"{kind}{i}_RT_3"] = f"{rng.random() * 9:.3f}"
                usable = chk.strip() == "1" and fb != "2" and row["Condition"].strip() in conditions \
                    and cell.strip() not in ("", "n/a")
                if usable:
                    expected.append((cond, real, i, p, (v - 1) / 5))
        rows.append([row.get(h, "") for h in head])
    with open(path, "w", encoding="utf-8-sig" if bom else "utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\r\n" if crlf else "\n")
        w.writerow(head)
        w.writerows(rows)
        f.write("\r\n" if crlf else "\n")                # a trailing blank line, as exports often have
    return expected


class Synthetic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        inputs, results = os.path.join(cls.tmp.name, "inputs"), os.path.join(cls.tmp.name, "results")
        os.makedirs(inputs)
        rng = random.Random(20211)
        cls.expected = {
            "s3": write_study(os.path.join(inputs, "Study_3_data.csv"), 12, ["1", "2"], 300, rng,
                              ["10/4/2017", "10/5/2017", "10/6/2017"], old_qualtrics=True),
            "s4": write_study(os.path.join(inputs, "Study_4_data.csv"), 12, ["1", "2"], 320, rng,
                              ["11/28/2017", "11/30/2017"], bom=False),
            "s5": write_study(os.path.join(inputs, "Study_5_data.csv"), 10, ["1", "2", "3", "4"], 400, rng,
                              ["4/30/2019", "5/1/2019", "5/2/2019"], crlf=False),
        }
        for f in run.CODE_FILES:
            with open(os.path.join(inputs, f), "w") as h:
                h.write("* stand-in\n")
        run.INPUTS, run.RESULTS = inputs, results
        run.main()
        with open(os.path.join(results, "outputs.json")) as f:
            cls.out = json.load(f)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_counts_follow_the_exclusion_rules(self):
        for s, exp in self.expected.items():
            self.assertEqual(self.out[f"{s}_n_obs"], len(exp))
            self.assertEqual(self.out[f"{s}_n_participants"], len({e[3] for e in exp}))
            self.assertEqual(self.out[f"{s}_n_headlines"], len({(e[1], e[2]) for e in exp}))

    def test_text_in_number_cells_is_counted(self):
        self.assertGreater(self.out["n_unreadable_cells"], 0)

    def test_period_is_read_from_the_data(self):
        self.assertEqual(self.out["period_from"], 20171004)
        self.assertEqual(self.out["period_to"], 20190502)

    def test_at_most_twenty_numeric_outputs(self):
        self.assertLessEqual(len([k for k in self.out if not k.startswith("period_")]), 20)
        self.assertTrue(all(isinstance(v, (int, float)) for v in self.out.values()))

    def test_synthetic_data_do_not_meet_the_published_targets(self):
        self.assertLess(self.out["targets_met"], 15)

    @unittest.skipIf(sm is None, "statsmodels not installed")
    def test_estimates_and_standard_errors_match_an_independent_implementation(self):
        for s, exp in self.expected.items():
            if s == "s5":
                X = [[1, c == "3", r, (c == "3") * r, c == "4", (c == "4") * r] for c, r, *_ in exp]
            else:
                X = [[1, c == "2", r, (c == "2") * r] for c, r, *_ in exp]
            X, y = np.array(X, dtype=float), np.array([e[4] for e in exp])
            pid = np.array([e[3] for e in exp])
            item = np.array([e[1] * 100 + e[2] for e in exp])
            fit = sm.OLS(y, X)
            v = (fit.fit(cov_type="cluster", cov_kwds={"groups": pid}).cov_params()
                 + fit.fit(cov_type="cluster", cov_kwds={"groups": item}).cov_params()
                 - fit.fit(cov_type="HC1").cov_params())
            b = fit.fit().params
            self.assertAlmostEqual(self.out[f"{s}_b_txv"], b[3], places=9)
            self.assertAlmostEqual(self.out[f"{s}_b_treatment"], b[1], places=9)
            self.assertAlmostEqual(self.out[f"{s}_se_txv"], float(np.sqrt(v[3, 3])), places=9)


class Pieces(unittest.TestCase):
    def test_us_dates(self):
        self.assertEqual(run.us_date("10/4/2017 10:00"), 20171004)
        self.assertEqual(run.us_date("11/29/2017"), 20171129)
        for bad in ("", " ", "2017-10-04", "13/1/2017", "1/1/17"):
            self.assertIsNone(run.us_date(bad))

    def test_destring(self):
        ex = run.Exclusions()
        self.assertIsNone(run.number(" ", ex, "c"))
        self.assertIsNone(run.number("n/a", ex, "c"))
        self.assertIsNone(run.number("nan", ex, "c"))
        self.assertEqual(run.number(" 3 ", ex, "c"), 3.0)
        self.assertEqual(ex.counts["unreadable cell in c"], 1)

    def test_models(self):
        self.assertEqual(run.s34(2, 1), [1.0, 1, 1, 1])
        self.assertIsNone(run.s34(3, 0))
        self.assertEqual(run.s5(4, 1), [1.0, 0.0, 1, 0.0, 1.0, 1.0])
        self.assertEqual(run.s5(2, 1), [1.0, 0.0, 1, 0.0, 0.0, 0.0])

    def test_known_regression(self):
        # y = 1 + 2x exactly: estimates exact, residuals zero, so every variance is zero.
        obs = [([1.0, float(x)], 1 + 2 * x, x % 3, x % 4) for x in range(12)]
        b, se, n, g1, g2 = run.cluster2(obs)
        self.assertAlmostEqual(b[0], 1, places=10)
        self.assertAlmostEqual(b[1], 2, places=10)
        self.assertEqual((n, g1, g2), (12, 3, 4))


if __name__ == "__main__":
    unittest.main()
