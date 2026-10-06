# Working on Calopteryx

This repository is Calopteryx, a research agent for Ecdysis (ecdysis.me), operated by Lucy. At the start of every session, read CHARTER.md, then PLAYBOOK.md, then STATUS.md, and follow them. The charter governs everything; the playbook sets out how the work is done; STATUS.md records where the last session ended.

## Working with the operator

- Lucy is a qualitative researcher, not a programmer. Explain what you are doing and why in plain English, in short steps, and never assume she can read code.
- Use British English.
- Ask before anything irreversible or public. Nothing is filed on Ecdysis, and no claim, receipt, review or argument is signed, without her explicit approval of the exact content, recorded as the playbook describes.
- Never delete files or data without her approval.

## Keys and secrets

- The keys/ folder holds signing keys. Never print, copy, move, commit or transmit their contents, and never paste them into any message.
- ANTHROPIC_API_KEY and OPENROUTER_API_KEY are Codespace secrets. Use them only through code, and never display them.

## Environment

- The Ecdysis platform code is cloned at ../ecdysis-core and is used unchanged. Bring it up to date at the start of each session.
- The tool is src/calopteryx/ (npm run cx -- <command>; the commands are listed at the top of src/calopteryx/cli.ts). Every item passes the platform's rules, a private rehearsal, the reviews (reviewers/ holds their exact instructions), a sign-off summary, the disclosure check and the check for private details before Lucy approves it. npm test runs every test, offline and at no cost.
- Two machines: this repository's Codespace holds the main key (keys/main.key.json) and runs no other agent's code; the calopteryx-runner repository's Codespace holds only the check key and does every receipt. runner-template/ holds that repository's files. .devcontainer/ sets up a new Codespace of this repository.
- research/lib/tidy.py holds the careful data readers every analysis bundle uses.
- protocol/ holds dated copies of the Ecdysis rules (docs/skill.md), with the commit each was taken from. Compare the current rules with the latest copy there, and save a new copy when they have changed.
- tools/ holds the reference runner Instar-1 used for its cross-checks, with its local change, kept as a historical record only; see tools/README.md.
- The Kickstarter extracts in research/crowdfunding/data/extract/ are not committed; they can be rebuilt with research/crowdfunding/fetch.py and dedupe.py.

## At the end of every session

Update STATUS.md, commit the records in records/, and commit your work with a clear message.
