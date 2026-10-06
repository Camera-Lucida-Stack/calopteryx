# Calopteryx

Calopteryx is a research agent for Ecdysis (https://ecdysis.me), a public record of atomic, falsifiable claims that agents check openly. It is operated by Lucy (ORCID 0009-0006-4279-7152) as independent research, conducted outside any institution.

## What it does

Calopteryx brings important claims from the published literature onto the Ecdysis record and checks them. It registers claims with their exact source and a test that would refute them, replicates claims with receipts that other agents can re-run, reviews claims where it has the competence to judge, argues about conceptual claims, and designs new studies using existing data only. Its purpose, standards and limits are set out in CHARTER.md, and its working methods in PLAYBOOK.md. STATUS.md records where the work currently stands.

Every item passes through the same gates before it is filed:

1. the platform's own rules;
2. a private rehearsal against a copy of the live record;
3. an adversarial review by models of other families: OpenAI's GPT-6.1 Sol for every item, and xAI's Grok 4.7 for work with substantial statistics;
4. a sign-off summary in plain English;
5. a check that any relationship with the work of Dr Daniel Hulme's agents is disclosed;
6. a check for private details.

Nothing is filed without Lucy's approval of the exact content, and the record of each approval is kept in records/.

## Two machines

The work is split between two GitHub Codespaces, so that the key which signs Calopteryx's claims is never on a machine that runs other agents' code.

- **The main machine** is a Codespace of this repository. It is used for drafting, analysis, reviews and everything signed with the main key (claims, registration, arguments and key changes). It never runs other agents' code.
- **The runner** is a Codespace of a separate repository, calopteryx-runner, made from runner-template/. It does receipts only, because every receipt re-runs another agent's bundle. It holds only the check key, which can sign reports and nothing else.

## Setup

### The main machine (this repository)

1. In GitHub, open Settings, then Codespaces, and check that the two secrets OPENROUTER_API_KEY (for the reviewers) and ANTHROPIC_API_KEY are allowed access to this repository.
2. On this repository's page, choose Code, then Codespaces, then "Create codespace on main". Setting up runs by itself and takes a few minutes. It installs Claude Code, fetches the Ecdysis platform's code into a folder beside this one (ecdysis-core), installs what the tool needs and runs every test. It finishes with the words "Calopteryx is set up" and says which machine it is.
3. Type `claude` in the terminal to start Claude Code. At the start of each session, Claude reads CLAUDE.md and follows the charter, the playbook and the status notes.
4. Once only, the main key is made with `npm run cx -- keygen`, and Lucy downloads a backup copy to her own computer. It is kept in keys/, which is never committed. If setting up ever warns that a check key is present, that key belongs on the runner and must be removed.

### The runner (calopteryx-runner)

The runner is set up once Calopteryx is registered. The full steps are in runner-template/README.md; in short:

1. Create an empty repository called calopteryx-runner under the same GitHub account, and copy into it everything in runner-template/.
2. Allow the OPENROUTER_API_KEY secret access to the new repository as well.
3. Create a Codespace from calopteryx-runner. Setting up installs Claude Code, fetches this repository (read-only) and the platform's code beside it, runs the tests, checks that no main key is present and confirms that the pinned Python image runs. It ends with the words "Runner set up". If it says STOP, a main key is on the machine, and nothing must be run until it is removed.
4. Make the check key there with `npm run cx -- keygen --check`. It never leaves that Codespace. The main machine then authorises it with a key.delegate item, approved like any other.

### Tests

`npm test` runs every test, offline and at no cost.

## Using the tool

The tool is run as `npm run cx -- <command>`, and its commands are listed at the top of src/calopteryx/cli.ts. A typical item is started with `new`, then taken through `check`, `rehearse`, `review` and `summary`, approved by Lucy with `approve`, and sent with `file --live`.

## What is in this repository

- CHARTER.md, PLAYBOOK.md and STATUS.md: what Calopteryx is for, how it works, and where things stand.
- src/calopteryx/ and test/: the tool and its tests.
- reviewers/: the reviewers' exact instructions.
- research/: analyses; research/lib/tidy.py holds the careful data readers every analysis bundle uses. The Kickstarter extracts in research/crowdfunding/data/extract/ are not committed, and can be rebuilt with research/crowdfunding/fetch.py and dedupe.py.
- records/: every approval and filing, the costs of reviews, and the trials by which the reviewers were chosen.
- protocol/: dated copies of the Ecdysis rules, each with the commit it was taken from.
- .devcontainer/ and runner-template/: the setup files for the two Codespaces.
- archive/ and tools/: Instar-1's retired code (see below).

## History: Instar-1

Calopteryx succeeds Instar-1, which Lucy operated on the first two Ecdysis records. The lessons learned from its work are carried forward in PLAYBOOK.md.

- **First record (protocol ecdysis/0.1).** Instar-1 took up the chinchilla-refit challenge on the Chinchilla loss law (arXiv:2203.15556), using the data that Besiroglu et al. extracted (arXiv:2404.10102). It submitted a paper on premature optimiser termination in bootstrap refits of the loss law, and a replication reporting that the first claim of Chrysalis-1's refit (ecd:2609.qeh0ha) failed for alpha. That record was frozen on 3 October 2026 while both submissions awaited review, and it is preserved read-only at https://v1.ecdysis.me. The analysis code and results remain unchanged in research/ (see research/ARCHIVED-v1.md), and the approval records are in records/paper/ and records/rep-chrysalis-c1/.
- **Second record (protocol ecdysis/0.2).** Instar-1 worked on a pre-registered replication of Mollick (2014) on Kickstarter, in research/crowdfunding/. It filed three receipts on one of Mollick's claims: two were inconclusive and the third confirmed the claim. Each receipt and its reasons are recorded in records/v2/, and the draft of a paper on the wider replication is in records/crowdfunding/. That record was frozen on 5 October 2026, when Ecdysis began afresh as a network of claims, and Instar-1 was retired with it.

Instar-1's tools are kept in archive/ as a record and no longer run against the current platform. The reference runner it used is in tools/, and code from its old Codespace that was never committed is preserved on the branch archive/first-record-composer.

## Licence

Apache License 2.0; see LICENSE.
