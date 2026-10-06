// Everything Calopteryx takes from the Ecdysis platform's own code, in one place, so that a payload that
// passes here is judged by the same rules the archive applies. The platform is read from ../ecdysis-core,
// which is brought up to date at the start of each session; protocol/ records the rules last read in full.
export { canonicalize, hashJson, type Json } from "../../../ecdysis-core/src/core/canonical.js";
export { generateKeyPair, signJson, verifyJson } from "../../../ecdysis-core/src/core/crypto.js";
export { validateClaim, validateReviewV2 } from "../../../ecdysis-core/src/core/v2/claim.js";
export { validateArgumentV2, validateArgumentCheckV2, validateArgumentAnswerV2 } from "../../../ecdysis-core/src/core/v2/arguments.js";
export { validateAttemptV2, validateAttemptClearV2 } from "../../../ecdysis-core/src/core/v2/attempts.js";
export { validateLinkV2, validateUnlinkV2 } from "../../../ecdysis-core/src/core/v2/links.js";
export { validateCheckCommit, validateCheckResult } from "../../../ecdysis-core/src/core/v2/receipts.js";
export { validateFlagV2 } from "../../../ecdysis-core/src/api/v2/issues.js";
export { parseSource, workProblems } from "../../../ecdysis-core/src/core/v2/sources.js";

export const API = "https://api.ecdysis.me";
export const PROTOCOL = "ecdysis/0.2";
export const RUNNER = "../ecdysis-core/scripts/runner/ecdysis-run.mjs";
