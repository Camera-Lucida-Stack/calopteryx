# Status

## Where things stand (6 October 2026)

- Ecdysis began a new record on 5 October 2026 (network/0.1: claims, without papers). Instar-1 was retired with the earlier record and its handle cannot be reused. Its work is preserved in this repository; the old Codespace's uncommitted code is archived on the branch archive/first-record-composer.
- The new agent is Calopteryx. It is not yet registered on Ecdysis.
- The rules were read in full on 6 October 2026 (protocol v0.2) and saved in protocol/. Challenges no longer exist on Ecdysis; the charter was amended accordingly on 6 October 2026, with Lucy's approval of the exact wording. The playbook's paragraph on independence was revised the same day: verification is to be requested after registration, and any deciding check on Dr Hulme's agents' work is flagged to Lucy first.
- ../ecdysis-core is current and unchanged; the old runner copy in tools/ is a historical record only.
- Reviewers are chosen but not yet wired into the code: the general review is OpenAI GPT-6.1 Sol (openrouter: openai/gpt-6.1-sol); the statistics specialist is DeepSeek V4 Pro (openrouter: deepseek/deepseek-v4-pro-0813). The review instructions, including the severity definitions, are in PLAYBOOK.md. src/v2.ts still calls Claude as its critic and must be changed.
- The keys in keys/ are Instar-1's and are retired. Calopteryx needs fresh keys.
- The OpenRouter key expires around 4 January 2027; a renewal reminder is in Lucy's calendar for 28 December 2026.

## Decisions taken on 6 October 2026

- Two Codespaces from two repositories. This repository's Codespace holds the main key only, for our own work. A new, separate repository (for example calopteryx-runner) has a Codespace holding only the check key, as a Codespace secret scoped to that repository, and does all receipt work, since every receipt includes a cross-check of another agent's bundle.
- The new main key is to be generated in a fresh Codespace of this repository, built from the new setup files, which also tests them.
- Doorbell: kind "email", to an address Lucy enters and confirms herself on her Ecdysis account page; cadence "weekly". Set up at registration.
- Verification: Lucy asks a steward once Calopteryx is registered; the date is then added to PLAYBOOK.md.

## The code rebuild (plan approved 6 October 2026)

The new tool is src/calopteryx/ (npm run cx). Retired code is in archive/. Approval refuses while any gate below is still to be built.

1. Done: every kind of filing, the platform's own checks, the two-machine key rules, receipts (smoke test and run, always in a pinned container).
2. Private rehearsal of every item against an in-memory copy of Ecdysis built from ../ecdysis-core.
3. Reviews through OpenRouter: the general review (GPT-6.1 Sol) for every item; the statistics review (DeepSeek V4 Pro) always for receipts and new research claims, and for anything else on request. Log the cost of every review, so the monthly spending report can be produced.
4. A plain-English sign-off summary under the playbook's four headings.
5. Any deciding check on work by Dr Hulme's agents stops for Lucy's recorded decision.
6. The identity check blocks private details (email addresses, phone numbers, home addresses and the like) while allowing the disclosures the charter requires: Lucy's role as operator and her relationship with Dr Hulme.
7. Tests on synthetic data with real-world clutter, using a stand-in reviewer.
8. Setup files (.devcontainer) for this repository and for the runner repository.

## Next steps, in order

1. Finish the code rebuild above.
2. Lucy creates the runner repository; a fresh Codespace of this repository is built from the new setup files.
3. Register Calopteryx: generate the main key in the fresh Codespace (Lucy keeps a backup), register with a pairing code from Lucy's account, delegate a check key to the runner Codespace, declare the model family, set the email doorbell (weekly). Then Lucy requests verification.
4. Start the methods library in methods/, verifying every citation.
5. Begin the trend work on Kickstarter over-funding as a chain of claims.
6. Update README.md, which still describes the first record and challenges.
