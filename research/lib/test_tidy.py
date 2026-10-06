"""Tests for tidy.py on synthetic data carrying the clutter real files carry (PLAYBOOK.md, Lessons learned 3)."""
import io
import json
import os
import sys
import unittest
import zipfile
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))
import tidy  # noqa: E402


def cluttered_zip():
    """A crawl-like archive with everything an archiver or a real crawl leaves in it."""
    projects = [
        {"id": 1, "state": "successful", "goal": 100, "pledged": 103, "launched_at": 1335830400},
        {"id": 2, "state": "failed", "goal": 500, "pledged": 20, "launched_at": 0},
        {"id": 3, "state": "successful", "goal": 1000, "pledged": 1100, "launched_at": 1335830400000},
        {"id": 3, "state": "successful", "goal": 1000, "pledged": 1250, "launched_at": 1335830400000},
        {"id": None, "state": "live", "goal": 10, "pledged": 1},
        {"id": 4, "state": "live", "goal": 50, "pledged": 5, "launched_at": "2012-07-31T23:30:00Z"},
    ]
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("Kickstarter/", "")
        z.writestr("__MACOSX/Kickstarter/._Kickstarter.json", b"\x00\x05\x16\x07binary resource fork")
        z.writestr("__MACOSX/Kickstarter/Kickstarter001.json", "[]")   # no leading dot: caught only as __MACOSX
        z.writestr("Kickstarter/.DS_Store", b"\x00\x00\x00\x01Bud1")
        z.writestr("Kickstarter/Thumbs.db", b"\xd0\xcf\x11\xe0")
        z.writestr("Kickstarter/README.txt", "Scraped by a robot.")
        # Two files: one JSON array with a byte-order mark; one with values written back to back.
        z.writestr("Kickstarter/Kickstarter001.json", "﻿" + json.dumps(projects[:3]))
        z.writestr("Kickstarter/Kickstarter002.json", "".join(json.dumps(p) for p in projects[3:]) + "\n")
    buf.seek(0)
    return zipfile.ZipFile(buf)


class ArchiveTests(unittest.TestCase):
    def test_clutter_is_skipped_and_counted(self):
        ex = tidy.Exclusions()
        names = tidy.data_members(cluttered_zip(), ex)
        self.assertEqual(names, ["Kickstarter/Kickstarter001.json", "Kickstarter/Kickstarter002.json"])
        self.assertEqual(ex.report(), {"archive: hidden, system or directory entry": 5, "archive: not a data file": 1})

    def test_every_record_is_read_through_bom_and_back_to_back_values(self):
        z, ex = cluttered_zip(), tidy.Exclusions()
        records = []
        for name in tidy.data_members(z, ex):
            for v in tidy.json_values(tidy.read_text(z, name)):
                records.extend(v if isinstance(v, list) else [v])
        self.assertEqual(len(records), 6)

    def test_ndjson(self):
        self.assertEqual(list(tidy.json_values('{"a": 1}\n{"a": 2}\n\n')), [{"a": 1}, {"a": 2}])


class DateTests(unittest.TestCase):
    may_2012 = datetime(2012, 5, 1, tzinfo=timezone.utc)

    def test_zero_and_negative_are_missing_never_1970(self):
        ex = tidy.Exclusions()
        self.assertIsNone(tidy.as_date(0, ex))
        self.assertIsNone(tidy.as_date(-5, ex))
        self.assertIsNone(tidy.as_date("0", ex))
        self.assertEqual(ex.report(), {"date: zero or negative": 3})

    def test_seconds_milliseconds_and_iso_agree(self):
        for v in (1335830400, 1335830400000, "1335830400", "2012-05-01T00:00:00Z", "2012-05-01T00:00:00+00:00"):
            self.assertEqual(tidy.as_date(v), self.may_2012, v)

    def test_absent_unparseable_and_implausible(self):
        ex = tidy.Exclusions()
        for v in (None, "", "soon", True, float("nan"), 86400):
            self.assertIsNone(tidy.as_date(v, ex), v)
        self.assertIsNone(tidy.as_date("2031-01-01", ex, latest=datetime(2026, 10, 6, tzinfo=timezone.utc)))
        self.assertEqual(ex.report(), {"date: absent": 2, "date: unparseable": 3,
                                       "date: before the earliest plausible date": 1, "date: after the latest plausible date": 1})

    def test_naive_iso_is_read_as_utc(self):
        self.assertEqual(tidy.as_date("2012-05-01T00:00:00"), self.may_2012)


class DedupeTests(unittest.TestCase):
    rows = [{"id": 3, "pledged": 1100}, {"id": None}, {"id": 3, "pledged": 1250}, {"id": 5, "pledged": 1}, {"id": 5, "pledged": 1}]

    def test_first_rule_counts_duplicates_and_disagreements(self):
        ex = tidy.Exclusions()
        kept = tidy.dedupe(self.rows, key=lambda r: r["id"], choose=lambda g: g[0], exclusions=ex, compare=["pledged"])
        self.assertEqual(kept, [{"id": 3, "pledged": 1100}, {"id": 5, "pledged": 1}])
        self.assertEqual(ex.report(), {"record: duplicate of an id already kept": 2,
                                       "record: duplicates disagreed on pledged": 1, "record: no id": 1})

    def test_last_rule(self):
        kept = tidy.dedupe(self.rows, key=lambda r: r["id"], choose=lambda g: g[-1], exclusions=tidy.Exclusions())
        self.assertEqual(kept[0]["pledged"], 1250)


class ThresholdTests(unittest.TestCase):
    def test_exactly_three_percent_over_counts_as_at_most_three_percent(self):
        over = 103 / 100 - 1                    # 0.030000000000000027 in floating point
        self.assertGreater(over, 0.03)          # the naive comparison gets it wrong
        self.assertTrue(tidy.at_most(over, 0.03))
        self.assertFalse(tidy.exceeds(1.10 - 1, 0.10))

    def test_a_real_excess_still_exceeds(self):
        self.assertTrue(tidy.exceeds(0.0600001, 0.06))
        self.assertFalse(tidy.at_most(0.031, 0.03))

    def test_share_of_nothing_is_none(self):
        self.assertIsNone(tidy.share([], lambda v: True))
        self.assertEqual(tidy.share([103 / 100 - 1, 0.5], lambda v: tidy.at_most(v, 0.03)), 0.5)


if __name__ == "__main__":
    unittest.main()
