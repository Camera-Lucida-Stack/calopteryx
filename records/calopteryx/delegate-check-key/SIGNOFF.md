# Sign-off: delegate-check-key

Item fingerprint: 37226d728139c6ed8919fd4353ad3b9656f8d7242c8b0339eae1ece35260b19d
(The approval command shows the start of this fingerprint; approve only if they match.)

## 1. What is being filed, and what it says

This authorises the check key made on the runner machine today to sign Calopteryx's reports: receipts (the commitment and the result of a check), reviews, attempts and checks of arguments. It can never sign a claim, a registration, an escalation or a change of keys; only the main key, which stays on this machine, can do those. Without it Calopteryx cannot do any check that runs another agent's work, because the charter keeps that work away from the main key. The request contains three things: the key's public half, the scope "reports", and the label "calopteryx-runner", which names the machine, not a person.

**Before you approve, please make one check on the runner.** In its terminal, type `npm run cx -- role`. It prints the runner's public key. Confirm that it ends **…uzYGGFU** and begins **MCowBQYDK2VwAyEAwQ3is5**, matching the key above. That proves this is the key that lives on the runner.

The exact content, as it will be signed (key.delegate):

- **key**: MCowBQYDK2VwAyEAwQ3is5bUvIhy0zdTnqxiAMP_ATM-cXXZb7ZZuzYGGFU
- **scope**: reports
- **label**: calopteryx-runner

## 2. What could be wrong with it

Two reviews were run, as the playbook requires after a blocking point. The first said the signature could not be seen, which is because the tool signs only at your approval; the rehearsal had already signed this exact request with Calopteryx's real main key, and a verified copy of the live record (628 entries) accepted it. The notes for the reviewer were revised to say so, and the second review found nothing blocking. Its three major points concern how far the safeguards around the runner reach, not the request itself; each is answered below. Reviews cost $0.0155 and $0.0192.

### [G1] MAJOR (clear error), from OpenAI GPT-6.1 Sol

This understates the trust boundary. Keeping the key outside the container prevents direct access by an ordinarily confined bundle, but a container escape is not the only possible route to misuse. Bundle outputs are attacker-controlled data consumed by host-side tooling; unsafe parsing, path or symlink handling, or signing requests insufficiently bound to the actual run can compromise report integrity without escaping the container. Compromise of the runner host or signing tool is another independent risk. The stated isolation controls do not exclude these paths.

The reviewer suggests: Describe container escape as one residual risk, not the sole one. Document and review how the host consumes results, handles paths and symlinks, validates report schemas, and binds each signature to the authorized bundle, inputs, execution and output. Include runner-host and signing-tool compromise in the threat model.

**Response:** Accepted, and the wording corrected: a container escape is one remaining risk, not the only one. The others, and what limits them: (1) The results a piece of code produces are read by the tool on the runner. The smoke test deletes them unread, keeping only their names; the real run reads them as plain data to draft the result, which then goes through every gate and your approval before anything is signed. Nothing from a result is ever run. (2) If the runner machine itself were taken over, the check key could be misused. Its damage is limited to reports, and the main key can revoke it. (3) The tool's code is public, at a known revision (cbca70a), and its tests pass. A separate signing service, as the reviewer suggests, would be stronger; it is more machinery than the risk justifies at present, and can be revisited if Calopteryx does many receipts.

### [G2] MAJOR (judgement call), from OpenAI GPT-6.1 Sol

The context asserts two important protocol guarantees without supplying their enforcement evidence: that scope “reports” admits exactly the five listed event types, and that a revocation disowns every report signed after the compromise time. The latter needs a trustworthy temporal rule. If it relies on a timestamp supplied by the compromised signer, an attacker could backdate a report. Revocation also does not itself undo downstream reliance on reports already consumed.

The reviewer suggests: Cite the applicable protocol rules and provide verifier tests showing that the delegated key is rejected for every prohibited event type. Specify how revocation interacts with record order, platform receipt time, event timestamps and late-submitted backdated reports. Explain how affected reports are marked and downstream users notified. If retrospective exclusion depends on assumptions, disclose them.

**Response:** Checked in the platform's own code (ecdysis-core e2fbe85, src/core/v2/flow.ts). Revocation uses the public log's own clock, never the date the signer writes: the code says so in terms ("The log's time, not the payload's, is what counts: a thief dates its own payloads"), so a report cannot be backdated to escape a revocation. The limit to the five kinds of report is stated in the rules (skill.md, section on keys) and was not re-tested here; the rehearsal confirms only that the delegation itself is accepted. The reviewer is right that revocation does not undo decisions already taken: the rules say a finding already decided stands, and the route is an appeal to a steward. That is accepted as the platform's rule.

### [G3] MAJOR (judgement call), from OpenAI GPT-6.1 Sol

The operational assurances are narrated but not accompanied by inspectable evidence. A private rehearsal returning 201 against a copy of the record supports a limited claim about that rehearsal; it does not independently establish the deployed platform's configuration, the production signing tool's sandbox enforcement, or the absence of bypass paths. No verifier version, rehearsal receipt, record snapshot identifier, actual image digest, tool revision or execution configuration is supplied. The explicit plan to compare the runner's public key at sign-off is useful, but that check has not yet occurred in the material under review.

The reviewer suggests: Retain and reference the exact payload hash, rehearsal verification output, verifier revision and record snapshot identifier. Record the signing-tool revision and actual pinned image digest, and provide evidence of the sandbox arguments and mount policy used. At approval, record completion of the planned public-key comparison and verify the final signature against the main key authorized by the live record. Describe the rehearsal as a rehearsal rather than evidence of live acceptance.

**Response:** Accepted in part. The rehearsal is a rehearsal, and is described as one; acceptance on the live record is shown only by the receipt once it is sent. Its record (rehearsal.json) keeps the payload's fingerprint, the number of entries copied and the time, and is committed with the approval. The tool revision is cbca70a and the platform revision e2fbe85. The image digest and container settings belong to each receipt, and are recorded with each smoke test and run, not with this key. The key comparison is your check above, made before approval.


## Dr Hulme's agents

Dr Hulme's agents on the record when this was rehearsed (operator op_225d348d88e2d6b727580ffc): Exuvia, Imago. This item does not touch their work.

## 3. What was already known

The decision to use two machines was taken on 6 October 2026: the main key here, the check key only on the runner, made there and never copied. You created the runner repository and its machine, and made the key there today; you copied its public half from the runner's own screen to this conversation. The rules permit a check key for exactly this purpose. Instar-1 had a check key on the earlier record, retired with it.

## 4. What happens once it is filed

The check key is authorised to sign reports (receipts, reviews, attempts and argument checks) for Calopteryx, and nothing else. It can be revoked with the main key.
