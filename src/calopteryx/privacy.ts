// The check for private details (charter, Ethical standards; Ecdysis's privacy rules). Every string an item will file is
// searched before it can be approved. It blocks email addresses, phone numbers, home addresses (UK postcodes and street
// addresses), personal identifiers (ORCID iDs, National Insurance and Social Security numbers, internet addresses), and
// the operator's own name and identifiers, read from config. It allows what the charter requires to be disclosed: that
// Calopteryx has an operator, and that the operator works with Dr Daniel Hulme, without naming her (Lucy, 6 October 2026).
// The operator's name is matched wherever it stands as a word, so it is blocked even inside a term such as
// "Lucy-Richardson"; such a text is reworded. Pattern matching cannot recognise every private detail, such as a private
// person's name; the reviewers and Ecdysis's own screening are further checks, and the sign-off summary shows the exact text.
import { existsSync, readFileSync } from "node:fs";
import { TOOL_ROOT } from "./platform.js";

/** Fields that hold keys, hashes and codes, never prose: not searched. */
const TECHNICAL = new Set(["publicKey", "sha256", "commit", "image", "imageRef", "signature", "key", "seal", "pairing", "hash"]);

const PATTERNS: [string, RegExp][] = [
  ["an email address", /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/],
  ["a phone number", /(?<![\w./:-])(?:\+\d{1,3}[\s.-]?)?\(?0\d{2,5}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}(?![\w/-]|\.\d)/],
  ["a phone number", /(?<![\w./:-])\+\d{1,3}[\s.-]?\d{2,5}[\s.-]?\d{3,4}[\s.-]?\d{3,4}(?![\w/-]|\.\d)/],
  ["a phone number", /(?<![\w./:-])\(?\d{3}\)?[\s.-]\d{3}[.-]\d{4}(?![\w/-]|\.\d)/],
  ["a UK postcode", /\b(?:[A-Z]{1,2}\d[A-Z\d]?|GIR) ?\d[ABD-HJLNP-UW-Z]{2}\b/],
  ["a street address", /\b\d{1,5}[A-Za-z]?,?\s+(?:[A-Z][a-z]+\s+){1,3}(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Close|Way|Crescent|Place|Pl|Court|Ct|Boulevard|Blvd|Gardens|Terrace|Square|Grove|Mews|Hill)\b\.?/],
  ["an ORCID iD", /\b\d{4}-\d{4}-\d{4}-\d{3}[\dX]\b/],
  ["a National Insurance number", /\b[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/],
  ["a Social Security number", /\b\d{3}-\d{2}-\d{4}\b/],
  ["an internet address", /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/],
];

/** The operator's own name and identifiers, from config.json (kept out of the repository) or config.example.json. */
export function operatorTerms(): string[] {
  for (const f of [`${TOOL_ROOT}/config.json`, `${TOOL_ROOT}/config.example.json`]) {
    if (existsSync(f)) { const t = JSON.parse(readFileSync(f, "utf8")).privacyTerms; if (Array.isArray(t)) return t.filter((x) => typeof x === "string" && x.trim()); }
  }
  throw new Error("no privacyTerms in config.json or config.example.json, so the operator's own details cannot be checked");
}

function strings(v: unknown, path: string, out: [string, string][]) {
  if (typeof v === "string") out.push([path, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${path}[${i}]`, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!TECHNICAL.has(k) && k !== "agent") strings(x, path ? `${path}.${k}` : k, out);
}

/** Every private detail found in the item, as "field: what (the text)". Empty when it is clean. */
export function privateDetails(p: Record<string, any>, terms: string[] = operatorTerms()): string[] {
  const found: string[] = [];
  const all: [string, string][] = [];
  strings(p, "", all);
  for (const [path, text] of all) {
    for (const [what, re] of PATTERNS) { const m = text.match(re); if (m) found.push(`${path}: ${what} ("${m[0].trim()}")`); }
    for (const t of terms) {
      const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?<![A-Za-z0-9])${esc}(?![A-Za-z0-9])`, "i").test(text)) found.push(`${path}: the operator's own name or identifier ("${t}")`);
    }
  }
  return [...new Set(found)];
}

// Ecdysis hands some replies a private link for the operator (for_your_person: the doorbell page on which she enters her
// address) or a secret shown once (a webhook's signing_secret). Anyone holding either could change where Calopteryx is
// woken, so neither may reach the public repository. The working copy in outbox/ keeps them, for the operator to use;
// the copy kept in records/ has them withheld (Lucy, 7 October 2026).
const WITHHELD = "[private link withheld from the public repository]";
const PRIVATE_LINKS: RegExp[] = [/https?:\/\/[^\s"\\]+\/doorbell\/[^\s"\\]+/g, /whsec_[A-Za-z0-9+/=_-]+/g];

/** The text with every private link and shown-once secret replaced; the count says how many were withheld. */
export function withholdPrivateLinks(text: string): { text: string; withheld: number } {
  let withheld = 0;
  for (const re of PRIVATE_LINKS) text = text.replace(re, () => (withheld++, WITHHELD));
  return { text, withheld };
}
