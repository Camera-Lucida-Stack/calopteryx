// Which machine this is, from the keys it holds (charter, Human control 2; decisions of 6 October 2026):
//   "main"   this repository's Codespace: the main key, as the file keys/main.key.json, and nothing of anyone else's is run;
//   "runner" the calopteryx-runner Codespace: only the check key, as the Codespace secret CALOPTERYX_CHECK_KEY; all receipts.
// Instar-1's retired keys (keys/agent.key.json, keys/check.key.json) are never read.
// Key contents are never printed: only public halves leave this module.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { generateKeyPair } from "./platform.js";

export const MAIN_KEY_FILE = "keys/main.key.json";
export const CHECK_KEY_ENV = "CALOPTERYX_CHECK_KEY";
export type Role = "main" | "runner" | "none";
type KeyPair = { publicKey: string; privateKey: string };

const hasMain = () => existsSync(MAIN_KEY_FILE);
const hasCheck = () => !!process.env[CHECK_KEY_ENV];

/** The machine's role. Both keys on one machine breaks the charter, so it is refused outright. */
export function role(): Role {
  if (hasMain() && hasCheck()) throw new Error(`this machine holds both the main key and the check key (${CHECK_KEY_ENV}); the charter keeps them on separate machines. Remove the check key secret from this Codespace before going on.`);
  return hasMain() ? "main" : hasCheck() ? "runner" : "none";
}

function parse(json: string, what: string): KeyPair {
  const k = JSON.parse(json) as Partial<KeyPair>;
  if (typeof k.publicKey !== "string" || typeof k.privateKey !== "string") throw new Error(`${what} is not a key pair {publicKey, privateKey}`);
  return k as KeyPair;
}
export function mainKey(): KeyPair { return parse(readFileSync(MAIN_KEY_FILE, "utf8"), MAIN_KEY_FILE); }
export function checkKey(): KeyPair { return parse(process.env[CHECK_KEY_ENV]!, CHECK_KEY_ENV); }

/** The key this machine signs with: the main key on the main machine, the check key on the runner. */
export function signingKey(): KeyPair {
  const r = role();
  if (r === "none") throw new Error("this machine holds no Calopteryx key, so nothing can be signed here.");
  return r === "main" ? mainKey() : checkKey();
}

/** Generates the main key, once. Never overwrites, and prints only the public half. */
export async function keygen(): Promise<string> {
  if (hasMain()) throw new Error(`${MAIN_KEY_FILE} already exists; it is never overwritten.`);
  if (hasCheck()) throw new Error("this is the runner machine; the main key is never generated where other agents' code runs.");
  const k = await generateKeyPair();
  mkdirSync("keys", { recursive: true, mode: 0o700 });
  writeFileSync(MAIN_KEY_FILE, JSON.stringify({ publicKey: k.publicKey, privateKey: k.privateKey }), { mode: 0o600, flag: "wx" });
  return k.publicKey;
}
