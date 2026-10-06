"""Careful readers for real research data (PLAYBOOK.md, Lessons learned 2 and 3, and Data handling).

Every analysis bundle reads its data through these functions, so that the clutter real files carry is handled the same
way everywhere and every exclusion is counted with its reason:

- archives: hidden and system entries (__MACOSX/, ._ files, .DS_Store, Thumbs.db, directories) are skipped and counted;
- text: a byte-order mark is removed; JSON may be one value, values written back to back, or one value per line;
- dates: zero, negative, unparseable and implausible dates are missing, never 1 January 1970; seconds, milliseconds and
  ISO 8601 text are all read;
- duplicates: the rule for choosing among records with the same id is stated by the caller, and duplicates whose
  fields disagree are counted;
- thresholds: values are compared with an explicit tolerance, because numbers such as 1.03 are stored inexactly, and a
  value exactly at a threshold must fall on the side the rule intends.

Standard library only, so it runs inside the reference runner's container.
"""
import io
import json
import zipfile
from collections import Counter
from datetime import datetime, timezone

TOLERANCE = 1e-9
_SYSTEM_NAMES = {".ds_store", "thumbs.db", "desktop.ini"}


class Exclusions:
    """Counts every record or file left out, by reason, so the report can say how many were discarded and why."""

    def __init__(self):
        self.counts = Counter()

    def add(self, reason, n=1):
        self.counts[reason] += n

    def report(self):
        return dict(sorted(self.counts.items()))


def is_clutter(name):
    """True for directory entries and the hidden or system files that archivers and operating systems add."""
    if name.endswith("/"):
        return True
    parts = [p for p in name.split("/") if p]
    if not parts:
        return True
    if any(p.startswith(".") or p == "__MACOSX" for p in parts):
        return True
    return parts[-1].lower() in _SYSTEM_NAMES


def data_members(zf, exclusions, suffixes=(".json", ".csv", ".ndjson", ".jsonl")):
    """The names of real data files in an open ZipFile, in sorted order; clutter and other files are counted and skipped."""
    out = []
    for name in sorted(zf.namelist()):
        if is_clutter(name):
            exclusions.add("archive: hidden, system or directory entry")
        elif not name.lower().endswith(suffixes):
            exclusions.add("archive: not a data file")
        else:
            out.append(name)
    return out


def read_text(zf, name):
    """A member's text, decoded as UTF-8 with any byte-order mark removed."""
    with zf.open(name) as f:
        return io.TextIOWrapper(f, encoding="utf-8-sig").read()


def json_values(text):
    """Every top-level JSON value in the text: one value, values back to back, or one per line (NDJSON)."""
    dec, i, n = json.JSONDecoder(), 0, len(text)
    while i < n:
        while i < n and text[i] in " \t\r\n":
            i += 1
        if i >= n:
            break
        value, i = dec.raw_decode(text, i)
        yield value


def as_date(value, exclusions=None, earliest=datetime(2000, 1, 1, tzinfo=timezone.utc), latest=None):
    """A UTC datetime, or None when the value is missing, zero, negative, unparseable or outside [earliest, latest].

    Numbers are read as seconds since 1970, or as milliseconds when too large to be seconds. Text is read as a number
    or as ISO 8601. A zero date means that something never happened, so it is missing, never 1 January 1970.
    """
    def missing(reason):
        if exclusions is not None:
            exclusions.add(f"date: {reason}")
        return None

    if value is None or value == "":
        return missing("absent")
    if isinstance(value, bool):
        return missing("unparseable")
    if isinstance(value, str):
        s = value.strip()
        try:
            value = float(s)
        except ValueError:
            try:
                d = datetime.fromisoformat(s.replace("Z", "+00:00"))
            except ValueError:
                return missing("unparseable")
            d = d if d.tzinfo else d.replace(tzinfo=timezone.utc)
            return _bounded(d.astimezone(timezone.utc), earliest, latest, missing)
    if not isinstance(value, (int, float)) or value != value:
        return missing("unparseable")
    if value <= 0:
        return missing("zero or negative")
    if value > 1e11:
        value = value / 1000.0
    try:
        d = datetime.fromtimestamp(value, tz=timezone.utc)
    except (OverflowError, OSError, ValueError):
        return missing("unparseable")
    return _bounded(d, earliest, latest, missing)


def _bounded(d, earliest, latest, missing):
    if earliest is not None and d < earliest:
        return missing("before the earliest plausible date")
    if latest is not None and d > latest:
        return missing("after the latest plausible date")
    return d


def dedupe(records, key, choose, exclusions, compare=None):
    """One record per id, chosen among duplicates by the caller's stated rule.

    choose(group) receives every record with the same id, in reading order, and returns the one to keep; the rule is the
    caller's to state and justify (for example the first seen, or the latest by date). Records without an id are counted
    and dropped. Duplicates are counted, and so are duplicates that disagree on the fields named in compare.
    """
    groups, order = {}, []
    for r in records:
        k = key(r)
        if k is None:
            exclusions.add("record: no id")
            continue
        if k not in groups:
            groups[k] = []
            order.append(k)
        groups[k].append(r)
    kept = []
    for k in order:
        g = groups[k]
        if len(g) > 1:
            exclusions.add("record: duplicate of an id already kept", len(g) - 1)
            if compare and len({tuple(json.dumps(r.get(f), sort_keys=True) for f in compare) for r in g}) > 1:
                exclusions.add("record: duplicates disagreed on " + ", ".join(compare))
        kept.append(choose(g))
    return kept


def at_most(x, threshold, tol=TOLERANCE):
    """x <= threshold, allowing for rounding error: a value stored a hair above the threshold counts as at it."""
    return x <= threshold + tol


def exceeds(x, threshold, tol=TOLERANCE):
    """x > threshold by more than rounding error: the complement of at_most."""
    return not at_most(x, threshold, tol)


def share(values, predicate):
    """The share of values satisfying predicate; None for an empty list, never a division by zero."""
    values = list(values)
    return None if not values else sum(1 for v in values if predicate(v)) / len(values)
