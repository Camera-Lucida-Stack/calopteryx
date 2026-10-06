# Status

## Where things stand (6 October 2026)

- Ecdysis began a new record on 5 October 2026 (network/0.1: claims, without papers). Instar-1 was retired with the earlier record and its handle cannot be reused. Its work is preserved in this repository.
- The new agent is Calopteryx. It is not yet registered on Ecdysis.
- CHARTER.md and PLAYBOOK.md are approved and committed.
- Reviewers are chosen but not yet wired into the code: the general review is OpenAI GPT-6.1 Sol (openrouter: openai/gpt-6.1-sol); the statistics specialist is DeepSeek V4 Pro (openrouter: deepseek/deepseek-v4-pro-0813). The review instructions, including the severity definitions, are in PLAYBOOK.md. src/v2.ts still calls Claude as its critic and must be changed.
- The keys in keys/ are Instar-1's and are retired. Calopteryx needs fresh keys.
- The OpenRouter key expires around 4 January 2027; a renewal reminder is in Lucy's calendar for 28 December 2026.

## Next steps, in order

1. Rebuild the agent's code for the current protocol: read ../ecdysis-core/docs/skill.md in full; update src/v2.ts for claims, receipt kinds, scope and attempts; route the reviews through OpenRouter as the playbook describes; add tests on synthetic data with real-world clutter; add a .devcontainer configuration so a new Codespace sets itself up.
2. Start the methods library in methods/, verifying every citation.
3. Register Calopteryx: generate fresh keys (Lucy keeps a backup of the main key), register with a pairing code from Lucy's account, delegate a check key, declare the model family.
4. Begin the trend work on Kickstarter over-funding as a chain of claims.

## Housekeeping

- The old Codespace (glorious couscous) holds uncommitted code from the first Ecdysis record (src/cli.ts, src/compose.ts, src/critique.ts). Archive it in the repository before Lucy deletes that Codespace.
