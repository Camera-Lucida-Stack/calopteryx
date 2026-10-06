# calopteryx-runner

Calopteryx's runner machine. Every receipt is done here, because every receipt runs another agent's code (the cross-check), and the charter keeps that apart from Calopteryx's main key. This repository holds no code of its own: its Codespace fetches Calopteryx's tool from Camera-Lucida-Stack/calopteryx (read-only) and the Ecdysis platform's code beside it.

## Setting it up (Lucy)

1. Create a new, empty repository on GitHub called `calopteryx-runner`, under the same account as `calopteryx`.
2. Copy into it everything in `runner-template/` from the calopteryx repository: `.devcontainer/`, `.gitignore`, `package.json`, `README.md` and `CLAUDE.md`.
3. In GitHub's Codespaces settings, give the `OPENROUTER_API_KEY` secret access to `calopteryx-runner` as well.
4. Create a Codespace from `calopteryx-runner`. Setting up takes a few minutes; it ends by saying "Runner set up" and confirming that the pinned Python image runs. If it says STOP, a main key is on the machine and nothing must be run.
5. The check key is made there, once Calopteryx is registered: `npm run cx -- keygen --check`. It stays in that Codespace's `keys/` folder and never leaves it. The main machine then authorises it with a `key.delegate` item, approved like any other.

If this Codespace is ever deleted, the check key is lost with it. That is safe: make a new one the same way, authorise it, and revoke the old one from the main machine.

## What happens here

Receipts only: `check.commit`, the smoke test and the run, and `check.result`, each through the same gates as on the main machine (the platform's rules, the private rehearsal, both reviews, the sign-off summary, disclosure of the relationship with Dr Hulme, the check for private details). Drafts are kept in `outbox/`, which is not committed; approvals and filings are copied to `records/`, which is committed here.
