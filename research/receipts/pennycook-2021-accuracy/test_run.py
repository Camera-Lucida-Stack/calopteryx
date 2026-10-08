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


def write_study(path, items, conditions, n, rng, dates, old_qualtrics=False, bom=True, crlf=True, pool_unknown=False):
    """A wide file, one row per participant, with the real files' clutter. Returns the expected clean observations.
    pool_unknown: a missing condition stays in as a control (Study 5's do-file), instead of being dropped (Studies 3-4)."""
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
               "Condition": cond if rng.random() > 0.03 else rng.choice([" ", "5"] if pool_unknown else [" ", "."]),
               "FB": fb, "SocialMedia_Chk": chk}
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
                    cell = rng.choice([".", ".a"])     # Stata's missing values: missing, not unreadable
                row[f"{kind}{i}_3"] = cell
                row[f"{kind}{i}_SM"] = str(rng.randint(1, 6))
                row[f"{kind}{i}_RT_3"] = f"{rng.random() * 9:.3f}"
                usable = chk.strip() == "1" and fb != "2" and cell.strip() not in ("", ".", ".a") \
                    and (pool_unknown or row["Condition"].strip() in conditions)
                if usable:
                    expected.append((row["Condition"].strip(), real, i, p, (v - 1) / 5))
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
                              ["4/30/2019", "5/1/2019", "5/2/2019"], crlf=False, pool_unknown=True),
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

    def test_study_5_keeps_a_missing_or_other_condition_as_a_control(self):
        # The synthetic data contain such participants, and the counts and the independent fit include them.
        self.assertTrue(any(e[0] == "" for e in self.expected["s5"]))
        self.assertTrue(any(e[0] == "5" for e in self.expected["s5"]))

    def test_stata_missing_values_are_missing_not_unreadable(self):
        self.assertEqual(self.out["n_unreadable_cells"], 0)

    def test_period_is_read_from_the_data(self):
        self.assertEqual(self.out["period_from"], 20171004)
        self.assertEqual(self.out["period_to"], 20190502)

    def test_at_most_twenty_numeric_outputs_period_included(self):
        # The plan registers 19 outputs, period_from and period_to among them. Since ecdysis-core ef41ddc the reference
        # runner counts the two period outputs apart from its limit of 20, as the archive does; 19 is within it either way.
        self.assertLessEqual(len(self.out), 20)
        self.assertEqual(len(self.out), 19)
        self.assertNotIn("s3_b_treatment", self.out)
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
            self.assertAlmostEqual(self.out[f"{s}_se_txv"], float(np.sqrt(v[3, 3])), places=9)


class Pieces(unittest.TestCase):
    def test_us_dates(self):
        self.assertEqual(run.us_date("10/4/2017 10:00"), 20171004)
        self.assertEqual(run.us_date("11/29/2017"), 20171129)
        self.assertEqual(run.us_date("2/29/2016"), 20160229)
        for bad in ("", " ", "2017-10-04", "13/1/2017", "1/1/17", "2/31/2019", "2/29/2019", "4/31/2018", "0/1/2018",
                    "1/0/2018"):
            self.assertIsNone(run.us_date(bad), bad)

    def test_destring(self):
        ex = run.Exclusions()
        self.assertIsNone(run.number(" ", ex, "c"))
        self.assertIsNone(run.number("n/a", ex, "c"))
        self.assertIsNone(run.number("nan", ex, "c"))
        self.assertIsNone(run.number("inf", ex, "c"))
        self.assertIsNone(run.number("-Infinity", ex, "c"))
        self.assertIsNone(run.number("1_0", ex, "c"))                 # Python's float() would read 10
        for missing in (".", ".a", ".z", " . "):
            self.assertIsNone(run.number(missing, ex, "c"))
        self.assertEqual(run.number(" 3 ", ex, "c"), 3.0)
        self.assertEqual(run.number("1e1", ex, "c"), 10.0)
        self.assertEqual(ex.counts["unreadable cell in c"], 5)     # n/a, nan, inf, -Infinity, 1_0; missing values are not

    def test_a_number_too_large_for_a_float_is_unreadable(self):
        # 1e999 matches NUMERIC but float() makes it inf: it must be unreadable, so scan() stops and number() counts it.
        self.assertTrue(run.unreadable("1e999"))
        self.assertTrue(run.unreadable("-1e999"))
        self.assertFalse(run.unreadable("1e308"))
        ex = run.Exclusions()
        self.assertIsNone(run.number("1e999", ex, "c"))
        self.assertIsNone(run.number("-1e999", ex, "c"))
        self.assertEqual(ex.counts["unreadable cell in c"], 2)

    def test_models(self):
        self.assertEqual(run.s34(2, 1), [1.0, 1, 1, 1])
        self.assertIsNone(run.s34(None, 0))                           # i.condition drops a missing condition
        for other in (3, 0, 9):                                       # and would add a category for any other value
            with self.assertRaises(SystemExit):
                run.s34(other, 0)
        self.assertEqual(run.s5(4, 1), [1.0, 0.0, 1, 0.0, 1.0, 1.0])
        self.assertEqual(run.s5(2, 1), [1.0, 0.0, 1, 0.0, 0.0, 0.0])
        for other in (None, 5, 0):                                    # Stata: condition==3 and ==4 are both false
            self.assertEqual(run.s5(other, 1), [1.0, 0.0, 1, 0.0, 0.0, 0.0])

    def test_known_regression(self):
        # y = 1 + 2x exactly: estimates exact, residuals zero, so every variance is zero.
        obs = [([1.0, float(x)], 1 + 2 * x, x % 3, x % 4) for x in range(12)]
        b, se, n, g1, g2 = run.cluster2(obs)
        self.assertAlmostEqual(b[0], 1, places=10)
        self.assertAlmostEqual(b[1], 2, places=10)
        self.assertEqual((n, g1, g2), (12, 3, 4))

    def test_zero_variance_gives_a_zero_standard_error(self):
        # Two exact points per cluster: every residual is zero, so the variance is exactly zero.
        obs = [([1.0, x], 3.0, i, i) for i, x in enumerate([0.0, 0.0, 1.0, 1.0])]
        obs = [([1.0, o[0][1]], 1.0 + 2.0 * o[0][1], o[2], o[3]) for o in obs]
        _, se, *_ = run.cluster2(obs)
        self.assertEqual(se, [0.0, 0.0])

    def test_non_finite_outputs_are_refused(self):
        self.assertEqual(run.finite({"a": 1, "b": 0.5}), {"a": 1, "b": 0.5})
        for bad in (float("nan"), float("inf"), -float("inf"), None, "1"):
            with self.assertRaises(SystemExit):
                run.finite({"a": 1, "b": bad})


def published():
    """The published values as run.py's got: every one of the 15 quantities exactly on target."""
    return {s: dict(t) for s, t in run.TARGETS.items()}


class Scoring(unittest.TestCase):
    def test_all_fifteen_matches_are_recognised(self):
        self.assertEqual(run.score(published()), 15)

    def test_each_quantity_failing_alone_costs_exactly_one(self):
        cases = 0
        for study, t in run.TARGETS.items():
            for q in ("b", "se", "n_obs", "n_participants", "n_headlines"):
                got = published()
                got[study][q] = t[q] * 1.5 if q == "se" else t[q] + (0.001 if q == "b" else 1)
                self.assertEqual(run.score(got), 14, (study, q))
                cases += 1
        self.assertEqual(cases, 15)

    def test_tolerance_boundaries(self):
        for study, t in run.TARGETS.items():
            for b, met in ((t["b"] + 0.0001, 15), (t["b"] - 0.0001, 15), (t["b"] + 0.000101, 14),
                           (t["b"] - 0.000101, 14)):
                got = published()
                got[study]["b"] = b
                self.assertEqual(run.score(got), met, (study, "b", b))
            for ratio, met in ((1.05, 15), (0.95, 15), (1.0501, 14), (0.9499, 14)):
                got = published()
                got[study]["se"] = t["se"] * ratio
                self.assertEqual(run.score(got), met, (study, "se", ratio))


def tiny(path, rows, items=1, cells=None, extra=None):
    """A minimal study file: rows of (condition, start, end); every participant shares politics and uses Facebook.
    cells maps (row, column) to a replacement value; extra maps a row to cells appended (+) or removed (-) at its end."""
    head = ["StartDate", "EndDate", "Condition", "FB", "SocialMedia_Chk"] + \
        [f"{k}{i}_3" for k in ("Fake", "Real") for i in range(1, items + 1)]
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(head)
        for p, (cond, s, e) in enumerate(rows):
            row = [s, e, cond, "1", "1"] + [str(1 + (p * 7 + i * 3 + p * i) % 6) for i in range(2 * items)]
            for (r, c), v in (cells or {}).items():
                if r == p:
                    row[head.index(c)] = v
            n = (extra or {}).get(p, 0)
            w.writerow(row + ["x"] * n if n >= 0 else row[:n])


class Stops(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.saved = run.INPUTS
        run.INPUTS = self.tmp.name

    def tearDown(self):
        run.INPUTS = self.saved
        self.tmp.cleanup()

    def obs(self, rows, model, **kw):
        tiny(os.path.join(self.tmp.name, "f.csv"), rows, **kw)
        ex = run.Exclusions()
        return run.observations("f.csv", kw.get("items", 1), model, ex), ex

    def test_study_5_missing_or_other_condition_is_a_pooled_control_and_counted(self):
        d = "4/30/2019"
        known = [(c, d, d) for c in "1234" * 3]
        (obs, _), ex = self.obs(known + [(" ", d, d), ("7", d, d), (".", d, d)], run.s5, items=3)
        pooled = {len(known), len(known) + 1, len(known) + 2}
        self.assertEqual({o[2] for o in obs} & pooled, pooled)        # in the fitted sample
        self.assertTrue(all(o[0][1] == o[0][4] == 0.0 for o in obs if o[2] in pooled))      # as controls
        self.assertEqual(ex.counts["f.csv: condition missing or other, kept as a pooled control (not excluded)"], 3)
        with_them = run.cluster2(obs)
        without = run.cluster2([o for o in obs if o[2] not in pooled])
        self.assertNotEqual(with_them[0], without[0])                 # and they change the estimates
        self.assertEqual(with_them[3] - without[3], 3)

    def test_studies_3_and_4_drop_a_missing_condition(self):
        rows = [("1", "10/4/2017", "10/4/2017"), ("2", "10/4/2017", "10/4/2017"), (" ", "10/5/2017", "10/5/2017")]
        (obs, _), ex = self.obs(rows, run.s34)
        self.assertEqual(sorted({o[2] for o in obs}), [0, 1])
        self.assertEqual(ex.counts["f.csv: condition missing"], 2)      # one per observation

    def test_an_analysed_participant_without_a_start_or_end_date_stops_the_run(self):
        for s, e in (("", "10/4/2017"), ("10/4/2017", ""), ("2/31/2018", "10/4/2017"), ("10/4/2017", "x")):
            with self.assertRaises(SystemExit, msg=(s, e)):
                self.obs([("1", "10/4/2017", "10/4/2017"), ("2", s, e)], run.s34)

    def test_undated_participants_are_counted_once_each(self):
        # Start missing on one row and end on another: two participants, where the old count gave one.
        rows = [("1", "", "10/4/2017"), ("2", "10/4/2017", ""), ("1", "10/4/2017", "10/4/2017")]
        with self.assertRaises(SystemExit) as c:
            self.obs(rows, run.s34)
        self.assertIn("2 analysed participant(s)", str(c.exception))

    def test_studies_3_and_4_stop_on_another_condition(self):
        with self.assertRaises(SystemExit):
            self.obs([("1", "10/4/2017", "10/4/2017"), ("2", "10/4/2017", "10/4/2017"), ("3", "10/4/2017", "10/4/2017")],
                     run.s34)

    def test_each_participants_dates_must_be_ordered_and_within_the_claims_period(self):
        ok = ("1", "10/4/2017", "10/4/2017")
        self.obs([ok, ("2", "10/1/2017", "5/31/2019")], run.s34)       # both boundaries are inside
        for s, e in (("10/5/2017", "10/4/2017"),                       # reversed
                     ("9/30/2017", "10/4/2017"),                       # start too early, on its own
                     ("10/4/2017", "6/1/2019"),                        # end too late, on its own
                     ("6/1/2019", "6/2/2019"),                         # start too late (end too)
                     ("9/29/2017", "9/30/2017")):                      # end too early (start too)
            with self.assertRaises(SystemExit, msg=(s, e)):
                self.obs([ok, ("2", s, e)], run.s34)

    def test_an_unreadable_token_anywhere_in_a_needed_column_stops_the_run_naming_it(self):
        d = "10/4/2017"
        rows = [("1", d, d), ("2", d, d), ("1", d, d)]
        for col, bad in (("Condition", "two"), ("FB", "n/a"), ("SocialMedia_Chk", "nan"), ("Fake1_3", "inf"),
                         ("Real1_3", "1_0"), ("FB", "1e999"), ("Fake1_3", "-1e999"), ("StartDate", "yesterday"),
                         ("EndDate", "2/31/2018")):
            # Row 2's participant is excluded (no answers at all), yet the token still stops the run, as in Stata.
            cells = {(2, "Fake1_3"): "", (2, "Real1_3"): "", (2, col): bad}
            with self.assertRaises(SystemExit, msg=col) as c:
                self.obs(rows, run.s34, cells=cells)
            self.assertIn(col.lower(), str(c.exception))
        (obs, _), ex = self.obs(rows, run.s34, cells={(1, "FB"): ".", (2, "Fake1_3"): ".b"})
        self.assertEqual(len({o[2] for o in obs}), 3)                 # Stata's missing values do not stop it

    def test_short_or_long_rows_stop_the_run(self):
        d = "10/4/2017"
        for n in (-1, 1):
            with self.assertRaises(SystemExit, msg=n):
                self.obs([("1", d, d), ("2", d, d)], run.s34, extra={1: n})

    def test_an_undated_participant_who_is_not_analysed_does_not_stop_the_run(self):
        (obs, dates), _ = self.obs([("1", "10/4/2017", "10/4/2017"), ("2", "10/4/2017", "10/4/2017"),
                                     (" ", "", "")], run.s34)
        self.assertEqual(len(dates), 2)

    def test_no_observations_stops_the_run(self):
        with self.assertRaises(SystemExit):
            self.obs([(" ", "10/4/2017", "10/4/2017")], run.s34)

    def test_period_must_lie_within_the_claims(self):
        self.assertEqual(run.period([(20171001, 20171002), (20190530, 20190531)]), (20171001, 20190531))
        for dates in ([(20170930, 20171004)], [(20171004, 20190601)], [], [(None, 20171004)], [(20171004, None)]):
            with self.assertRaises(SystemExit, msg=dates):
                run.period(dates)


if __name__ == "__main__":
    unittest.main()
