# Automating Calopteryx: plan

Draft of 8 October 2026, for the operator's approval. Nothing in it is built until she approves it. The comparison behind it (options A to D) is in the operator's document "Where Calopteryx's main key should live".

## Aim

Ecdysis wakes Calopteryx when work falls due. The work is prepared automatically, the operator approves the exact item from her email and GitHub, and plain code signs and sends that item and nothing else. No Codespace needs to be opened.

## Principles

The operator's four principles of 8 October 2026, and the five she added the same day:

1. The main key never sits where other agents' code runs.
2. The operator keeps the backup of every key and can revoke any of them.
3. As few third parties as possible hold a key.
4. The platform never holds a key.
5. The model never handles a signing key.
6. A written plan revokes any key within minutes (REVOCATION.md, below).
7. A single off switch stops all automation.
8. Any token Ecdysis holds is narrow and expires.
9. Every signature is recorded in this repository.

## The shape: two separate parts

**Preparation (private repository, no keys).** The repository Camera-Lucida-Stack/calopteryx-runner, which already exists and is private, becomes the working repository. Its workflows:

- are started by the doorbell, or by a daily timetable as a fallback;
- read the heartbeat (plain code);
- run any bundle in the pinned, sealed container, in a job that holds no secret at all;
- let the model draft an item, in a job whose only secret is the API key that pays for that model;
- run the gates as plain code: the platform's checks, the private rehearsal, the reviews (the OpenRouter key is given to this job only), the disclosure check, the check for private details, and the sign-off summary;
- save the draft and its summary in the private repository, and open an issue there holding the summary and the item's fingerprint, which GitHub emails to the operator.

**Signing (this public repository, no model).** A workflow of plain code, with two protected environments: `check-signing` holds the check key and `main-signing` holds the main key. Only the operator can start it, and each run:

1. The operator starts it from the link in the email, pasting the fingerprint she approved. This is her recorded approval of the exact content.
2. It fetches that draft from the private repository with a read-only token, recomputes the fingerprint and stops on any difference.
3. It waits at GitHub's approval gate. The operator's click on Approve is her instruction to send. Only then does GitHub release the key to the job.
4. It signs, sends, and commits a record of the signature to records/signatures/ in this repository: the item, its fingerprint, the signature, who approved it and when, the run's address, and Ecdysis's reply.

The model never runs in the signing workflow, and the signing workflow never runs a bundle. Ecdysis's token can start only the private repository's workflows, so it cannot reach the signing workflow, and the gate stands behind it in any case. GitHub offers the approval gate free only in public repositories, which is why signing lives here.

**The off switch.** One file in this repository, `automation/switch`, holds `on` or `off`. Every workflow in both repositories reads it first and stops unless it says `on`, and also stops if it cannot read it. The operator turns everything off by editing that one line in the browser.

**Ecdysis's token.** If the doorbell is set to start GitHub Actions, it gets a fine-grained token for the private repository only, with Actions: read and write and nothing else, expiring after 30 days, with a calendar reminder to renew. The fallback is the daily timetable, under which Ecdysis holds no token at all.

## Stages

1. **Now: principles and safeguards.** The five new principles go into the charter and playbook (wording below, for approval). REVOCATION.md is written and rehearsed on paper. The off switch is created, set to `off`.
2. **The runner, automated first.** Receipt work moves into the private repository's workflows and the `check-signing` environment: a new check key is made for it, delegated with the main key and recorded; the old check key on the runner Codespace is then revoked. The receipt now in progress (Pennycook et al. 2021) is finished by hand on the runner Codespace first, so nothing in flight is disturbed.
3. **Preparation of main-key items (option C).** Claims, reviews and arguments are drafted and taken through the gates automatically, and emailed. For these stages the operator still signs in the Codespace.
4. **Signing main-key items (option B).** The main key moves into the `main-signing` environment. The copy in this Codespace is then deleted, and the operator keeps her backup.

Each stage is tested end to end on a stand-in agent and the saved copy of the public log before it touches the live record, and the operator approves each before it goes live. The aim is to reach stage 4 within weeks.

## REVOCATION.md (to be written in stage 1)

Steps for each case, each doable from a phone:

- **Anything suspicious:** set the off switch to `off`; stop the doorbell from the operator's Ecdysis page.
- **A key may be exposed:** revoke it from https://api.ecdysis.me/me, which needs no key, giving the earliest time it may have been exposed; delete the GitHub environment secret; make and delegate a replacement.
- **A GitHub token may be exposed:** revoke it at github.com/settings/personal-access-tokens.
- **GitHub or Anthropic reports a breach:** all of the above for every key and token they held.

## Cost

Bundle runs and preparation use the private repository's included GitHub Actions minutes (2,000 a month on the free plan); signing in this public repository is free. The model's drafting is billed per use through the Anthropic API, and the reviews through OpenRouter as now; both are logged and reported monthly.

## Proposed wording for the charter (Human control)

Added to the charter's section "Human control":

> 5. The model that drafts Calopteryx's work never handles a signing key. Signing is done by plain code that signs only the item whose fingerprint the operator approved, and every signature is recorded in the repository.
> 6. Any token Ecdysis holds to start Calopteryx is limited to starting its work and expires; any key can be revoked within minutes by the written plan in REVOCATION.md; and a single switch stops all automation.

Point 3 of that section would read:

> 3. Live writes to Ecdysis require both a recorded approval and an explicit instruction to send. Where signing is automated, the operator's approval is her starting of the signing run with the item's fingerprint, and her instruction to send is her approval at GitHub's gate.

## Decisions for the operator

1. The meaning of approval and of the instruction to send, as in the wording above.
2. A new check key for the automated runner, held as a GitHub environment secret. This reverses the decision of 6 October 2026 that the check key never leaves the runner Codespace.
3. Sign-off summaries emailed as GitHub issues in the private repository, which needs no new password, in place of a mail service with its own password.
4. The private repository calopteryx-runner reused as the working repository, in place of a new one.
5. The model's job holds the API key that pays for the model itself. Principle 5 covers signing keys, and no other secret is given to that job.
