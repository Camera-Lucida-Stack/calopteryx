# Sign-off: revoke-runner-check-key

Item fingerprint: 4dc0d03ae0c68bf6cbb6da7ffe31fd71b0459e7c037c82afcc519a534ff8b411
(The approval command shows the start of this fingerprint; approve only if they match.)

## 1. What is being filed, and what it says

This withdraws the check key that lived on the old runner Codespace. The runner Codespace was deleted by GitHub while your account was suspended, and the key's secret half existed nowhere else, so the key can never be used by us again. Ecdysis still lists it as authorised to sign reports in Calopteryx's name. Withdrawing it tidies the record and closes off any small chance that a leftover copy could be misused.

The filed item contains only the key's public half. It deliberately gives **no "compromised since" time**. On Ecdysis, a time would cancel ("disown") everything the key signed after that moment. Leaving it out means nothing is cancelled, so the Pennycook receipt that this key signed on 8 October stands exactly as it is. The private rehearsal confirmed this: the copy of the record accepted the withdrawal and cancelled nothing.

Ecdysis has no space for a written reason on a withdrawal. Your statement that the key was destroyed with the deleted Codespace and was not compromised is therefore recorded in this summary, in the draft's note and in records/, and the absence of a "compromised since" time is consistent with it.

The exact content, as it will be signed (key.revoke):

- **key**: MCowBQYDK2VwAyEAwQ3is5bUvIhy0zdTnqxiAMP_ATM-cXXZb7ZZuzYGGFU

## 2. What could be wrong with it

The review (GPT-6.1 Sol, $0.014) found nothing blocking and judged the withdrawal appropriate, including the choice to give no compromise time. Its three points concern only the wording of our private note, which is never filed; the item itself was not criticised. The note was corrected after the review on all three points. Because the filed content did not change, no second review was needed.

### [G1] MAJOR (judgement call), from OpenAI GPT-6.1 Sol

The account establishes reported deletion of the Codespace and a decision not to copy the key, but does not establish irreversible destruction of every private-key copy. A decision not to copy is not itself verification that no copy existed, and deletion of a hosted environment does not establish erasure of provider-retained copies. This does not make revocation inappropriate or establish compromise, but the categorical destruction claim exceeds the evidence presented.

The reviewer suggests: Attribute the account explicitly: Lucy reports that the only known operational copy was in the deleted Codespace, no intentional copies were made, and no unauthorized access is known or suspected. Describe the key as lost or inaccessible unless stronger destruction evidence exists. Retain revocation regardless.

**Response:** Accepted and fixed in the note. We cannot prove that GitHub kept no copy after deleting the Codespace. The note now says that you report the only copy was in that Codespace, that no copy was made, and that no one else is known or suspected to have had access, and that the key is treated as lost and withdrawn regardless. Your own words ("destroyed, not compromised") are kept and attributed to you. The two minor points were fixed in the same way: the note now says that leaving out the time asks for nothing to be cancelled without itself recording the reason, and that the withdrawal makes Ecdysis refuse the key from now on (it cannot stop a stray copy from producing signatures, only stop them counting).


Minor points, for information:

- [G2] Under the quoted API description, omission communicates that no compromise cutoff is supplied and therefore no reports are retrospectively disowned. It does not encode destruction as the reason for revocation. Several other circumstances could produce exactly the same payload.
- [G3] Revocation does not prevent the private key from generating signatures if a copy still exists. It changes whether the platform accepts or recognizes subsequent signatures. The distinction matters particularly when explaining why revocation remains useful despite the reported loss of the private key.

## Dr Hulme's agents

Dr Hulme's agents on the record when this was rehearsed (operator op_225d348d88e2d6b727580ffc): Exuvia, Imago. This item does not touch their work.

## 3. What was already known

- The key was authorised on 7 October 2026 (log entry 628) and signed exactly two things: the Pennycook receipt's commitment (entry 1127) and its result (entry 1246), both on 8 October 2026. Nothing has been signed for Calopteryx since.
- You decided on 17 October 2026 to work from this one Codespace for now. Calopteryx therefore does no receipts until a new runner is built and a new check key is authorised, which would be a separate item for your approval.
- Withdrawing a check key does not affect Calopteryx's main key, its registration or its verified standing.
- Note on section 4 below: its standard wording speaks of reports signed "from the stated time". This item states no time, so no report is cancelled.

## 4. What happens once it is filed

Every report the key signed from the stated time is disowned and feeds no number. This cannot be undone.
