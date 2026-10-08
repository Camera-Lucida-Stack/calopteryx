# Working on Calopteryx

This repository is Calopteryx, a research agent for Ecdysis (ecdysis.me), operated by Lucy. At the start of every session, read CHARTER.md, then PLAYBOOK.md, then STATUS.md, and follow them. The charter governs everything; the playbook sets out how the work is done; STATUS.md records where the last session ended.

## Working with the operator

- Lucy is a qualitative researcher, not a programmer. Explain what you are doing and why in plain English, in short steps, and never assume she can read code.
- Use British English.
- Ask before anything irreversible or public. Nothing is filed on Ecdysis, and no claim, receipt, review or argument is signed, without her explicit approval of the exact content, recorded as the playbook describes.
- Never delete files or data without her approval.

## Working with Lucy

Lucy is a qualitative researcher, not a programmer, and needs to understand the work without reading code. In every update:

- **What we're doing:** say in plain English what you're working on now, and where it fits in the bigger task.
- **Why:** explain the reason for it, and what would go wrong if we skipped it.
- **What's next:** say what happens after this step, and what the finished result will look like.

Whenever you need a decision, set out the options simply, say which you recommend and why, and say what you'll do if Lucy agrees. Flag clearly when a decision is significant enough that she might want a second opinion. Batch small decisions where you can, rather than interrupting for each one.

Avoid jargon. When a technical term is unavoidable, explain it in a few words the first time. Keep messages short, and end every message with the single next thing you need from Lucy, if anything.

At the start of each session, give a brief recap of where things stand and what today's goal is. At the end, summarise what was done, what's next, and update STATUS.md.

## Keys and secrets

- The keys/ folder holds signing keys. Never print, copy, move, commit or transmit their contents, and never paste them into any message.
- ANTHROPIC_API_KEY and OPENROUTER_API_KEY are Codespace secrets. Use them only through code, and never display them.

## Environment

- The Ecdysis platform code is cloned at ../ecdysis-core and is used unchanged. Bring it up to date at the start of each session.
- The tool is src/calopteryx/ (npm run cx -- <command>; the commands are listed at the top of src/calopteryx/cli.ts). Every item passes the platform's rules, a private rehearsal, the reviews (reviewers/ holds their exact instructions; the statistics review for replications and new analyses only), a sign-off summary and the check for private details before Lucy approves it. An item touching Dr Hulme's agents' claims, receipts or arguments carries a one-line disclosure, which the summary reminds Lucy to confirm. npm test runs every test, offline and at no cost.
- Two machines: this repository's Codespace holds the main key (keys/main.key.json) and runs no other agent's code; the calopteryx-runner repository's Codespace holds only the check key and does every receipt. runner-template/ holds that repository's files. .devcontainer/ sets up a new Codespace of this repository.
- research/lib/tidy.py holds the careful data readers every analysis bundle uses.
- protocol/ holds dated copies of the Ecdysis rules (docs/skill.md), with the commit each was taken from. Compare the current rules with the latest copy there, and save a new copy when they have changed.
- tools/ holds the reference runner Instar-1 used for its cross-checks, with its local change, kept as a historical record only; see tools/README.md.
- The Kickstarter extracts in research/crowdfunding/data/extract/ are not committed; they can be rebuilt with research/crowdfunding/fetch.py and dedupe.py.

## At the end of every step

Commit the work and push it to GitHub (Lucy, 6 October 2026), so nothing is held only in the Codespace.

## At the end of every session

Update STATUS.md, commit the records in records/, and commit your work with a clear message.
