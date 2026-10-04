"""Mollick (2014) narrow-success claim on Web Robots' Kickstarter crawl of 22 April 2014 (see PLAN.md).

Reads the crawl at inputs/kickstarter-2014-04-22.zip (an inputs/0.1 input fetched and verified by the
runner), keeps the first record per project id, keeps decided campaigns (failed or successful) with a
positive goal, and writes results/outputs.json: numbers only. All randomness comes from ECDYSIS_SEED;
the clock is never read. Standard library only.
"""
import io, json, math, os, random, sys, zipfile
from datetime import datetime, timezone

INPUT = "inputs/kickstarter-2014-04-22.zip"
RESAMPLES = 200
JULY_2012_END = datetime(2012, 8, 1, tzinfo=timezone.utc).timestamp()


def projects(obj):
    """Yield project records from the containers Web Robots used in 2014 (lists, pages of 'projects')."""
    if isinstance(obj, list):
        for x in obj:
            yield from projects(x)
    elif isinstance(obj, dict):
        if "projects" in obj:
            yield from projects(obj["projects"])
        elif "data" in obj and isinstance(obj["data"], (dict, list)):
            yield from projects(obj["data"])
        elif "id" in obj and "state" in obj:
            yield obj


def records(path):
    with zipfile.ZipFile(path) as z:
        for name in z.namelist():
            base = name.rsplit("/", 1)[-1]
            # skip folders and the hidden files archivers add (__MACOSX/, ._name, .DS_Store): only .json data files are read
            if name.endswith("/") or name.startswith("__MACOSX/") or base.startswith(".") or not base.lower().endswith(".json"):
                continue
            text = io.TextIOWrapper(z.open(name), encoding="utf-8").read()
            dec, i, n = json.JSONDecoder(), 0, len(text)
            while i < n:                                   # one array, or objects written back to back
                while i < n and text[i] in " \t\r\n,[]":
                    i += 1
                if i >= n:
                    break
                obj, i = dec.raw_decode(text, i)
                yield from projects(obj)


def nearest_rank(sorted_values, p):
    return sorted_values[max(1, math.ceil(p * len(sorted_values))) - 1]


def main():
    seed_hex = os.environ["ECDYSIS_SEED"]
    if len(seed_hex) != 64:
        sys.exit("ECDYSIS_SEED must be 64 hex characters")
    rng = random.Random(int(seed_hex[:16], 16))
    rows, seen, failed, over = 0, set(), [], []
    years, launched_in_window, over_in_window = [], 0, []
    for p in records(INPUT):
        rows += 1
        pid = p.get("id")
        if pid is None or pid in seen:
            continue
        seen.add(pid)
        try:
            launched = float(p["launched_at"])
            in_window = launched < JULY_2012_END
        except (KeyError, TypeError, ValueError):
            launched, in_window = None, False
        launched_in_window += in_window          # every state: the completeness check counts all launched projects
        if p.get("state") not in ("failed", "successful"):
            continue
        try:
            goal, pledged = float(p["goal"]), float(p["pledged"])
        except (KeyError, TypeError, ValueError):
            continue
        if not (goal > 0 and pledged >= 0 and math.isfinite(goal) and math.isfinite(pledged)):
            continue
        r = pledged / goal
        if launched is not None:
            try:
                years.append(datetime.fromtimestamp(launched, tz=timezone.utc).year)
            except (OverflowError, OSError, ValueError):
                pass
        if p["state"] == "successful":
            over.append(r - 1.0)
            if in_window:
                over_in_window.append(r - 1.0)
        else:
            failed.append(r)
    if not failed or not over:
        sys.exit("no decided campaigns found")
    over_sorted, window_sorted = sorted(over), sorted(over_in_window)
    share = lambda xs, pred: sum(1 for x in xs if pred(x)) / len(xs)

    def bootstrap(values, statistic):
        n, draws = len(values), []
        for _ in range(RESAMPLES):
            draws.append(statistic([values[rng.randrange(n)] for _ in range(n)]))
        mean = sum(draws) / RESAMPLES
        return math.sqrt(sum((d - mean) ** 2 for d in draws) / (RESAMPLES - 1))

    n_dec = len(failed) + len(over)
    out = {
        "n_rows": rows, "n_projects": len(seen), "n_decided": n_dec, "n_failed": len(failed), "n_successful": len(over),
        "success_rate": round(len(over) / n_dec, 6),
        "failed_mean_ratio": round(sum(failed) / len(failed), 6),
        "failed_share_ge30": round(share(failed, lambda x: x >= 0.30), 6),
        "failed_share_ge50": round(share(failed, lambda x: x >= 0.50), 6),
        "success_p25_over": round(nearest_rank(over_sorted, 0.25), 6),
        "success_median_over": round(nearest_rank(over_sorted, 0.50), 6),
        "success_share_le3over": round(share(over, lambda x: x <= 0.03), 6),
        "success_share_le10over": round(share(over, lambda x: x <= 0.10), 6),
        "se_success_median_over": round(bootstrap(over_sorted, lambda s: nearest_rank(sorted(s), 0.50)), 6),
        "n_launched_by_july_2012": launched_in_window,
        "n_successful_to_july_2012": len(window_sorted),
        "success_p25_over_to_july_2012": round(nearest_rank(window_sorted, 0.25), 6) if window_sorted else -1,
        "success_median_over_to_july_2012": round(nearest_rank(window_sorted, 0.50), 6) if window_sorted else -1,
        "first_launch_year": min(years) if years else 0, "last_launch_year": max(years) if years else 0,
    }
    os.makedirs("results", exist_ok=True)
    with open("results/outputs.json", "w") as f:
        json.dump(out, f, sort_keys=True)
    print(json.dumps(out, sort_keys=True))


if __name__ == "__main__":
    main()
