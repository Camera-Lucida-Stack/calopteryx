# Handover to the runner: Pennycook et al. (2021) reproduction check

For the Claude session on the calopteryx-runner Codespace. Read SCOPING.md and PLAN.md in this folder first. The plan and code were approved by Lucy on 7 October 2026; nothing has been filed for this receipt and nothing has been computed from the real data.

1. Bring ../calopteryx and ../ecdysis-core up to date (re-run the setup script, or `git pull --ff-only` in each), and run `npm test` in ../calopteryx (needs statsmodels for the independent comparison; without it that one test is skipped).
2. Download the five inputs from OSF (`curl -L https://osf.io/download/<id>/`, ids sd643, 5ta42, nu3qp, vdne6, mwrx2) into a new, empty folder, and check each SHA-256 and size against PLAN.md. Put verified copies in the runner's inputs cache under their SHA-256 (inputs-cache/<sha256>), so the reference runner finds them without fetching; the runner verifies them again.
3. Draft the receipt: `npm run cx -- new pennycook-2021-receipt check.commit`, then fill it in:
   - target ext:c9c5c670f8aa1b81; kind "replication"; design {method "stated", data "original", period {from "2017-10", to "2019-05"}, basis: the claim's own data of record, all five files by hash};
   - bundle: repo https://github.com/Camera-Lucida-Stack/calopteryx, commit = the commit that holds this file (full 40-hex hash), the pinned image (CALOPTERYX_PY_IMAGE), run `python3 research/receipts/pennycook-2021-accuracy/run.py`, the 19 outputs named in PLAN.md, period_from and period_to included (estimates and standard errors with tolerance 1e-9, counts exact), runtimeMinutes 5, inputs as in PLAN.md's table (access "open", licence "none stated by the authors on OSF; fetched from source, not redistributed");
   - methods: a short account of PLAN.md, including the OSF redirect and the `--input` workaround;
   - context: notes for the reviewers and Lucy (never filed).
4. Smoke test (`npm run cx -- smoke pennycook-2021-receipt`), outputs deleted unread. Then the platform's checks, the rehearsal, both reviews (the statistics review is required for receipts), the sign-off summary, and Lucy's approval of the exact content. File only on her instruction.
5. Run under the archive's seed (`npm run cx -- run pennycook-2021-receipt`), complete any cross-check the seal assigns, and file check.result by PLAN.md's outcome rule, whatever it shows, again after Lucy's approval.

Records of each step go in the runner repository's records/ and are committed there.
