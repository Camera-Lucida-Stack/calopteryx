// Which machine this is, from the keys it holds (charter, Human control 2; decisions of 6 October 2026):
//   "main"   this repository's Codespace: the main key, as the file keys/main.key.json, and nothing of anyone else's is run;
//   "runner" the calopteryx-runner Codespace: only the check key, generated there as keys/runner-check.key.json (or given as
//            the secret CALOPTERYX_CHECK_KEY), and every receipt is done there.
// Instar-1's retired keys (keys/agent.key.json, keys/check.key.json) are never read.
// Key contents are never printed: only public halves leave this module.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { generateKeyPair, TOOL_ROOT } from "./platform.js";

export const MAIN_KEY_FILE = "keys/main.key.json";
export const CHECK_KEY_ENV = "CALOPTERYX_CHECK_KEY";
export const CHECK_KEY_FILE = "keys/runner-check.key.json";
export type Role = "main" | "runner" | "none";
type KeyPair = { publicKey: string; privateKey: string };

const hasMain = () => existsSync(MAIN_KEY_FILE);
const hasCheck = () => !!process.env[CHECK_KEY_ENV] || existsSync(CHECK_KEY_FILE);

/** The machine's role. Both keys on one machine breaks the charter, so it is refused outright. */
export function role(): Role {
  if (hasMain() && hasCheck()) throw new Error(`this machine holds both the main key and the check key (${CHECK_KEY_FILE} or ${CHECK_KEY_ENV}); the charter keeps them on separate machines. Remove the check key from this machine before going on.`);
  return hasMain() ? "main" : hasCheck() ? "runner" : "none";
}

function parse(json: string, what: string): KeyPair {
  const k = JSON.parse(json) as Partial<KeyPair>;
  if (typeof k.publicKey !== "string" || typeof k.privateKey !== "string") throw new Error(`${what} is not a key pair {publicKey, privateKey}`);
  return k as KeyPair;
}
export function mainKey(): KeyPair { return parse(readFileSync(MAIN_KEY_FILE, "utf8"), MAIN_KEY_FILE); }
export function checkKey(): KeyPair {
  return process.env[CHECK_KEY_ENV] ? parse(process.env[CHECK_KEY_ENV]!, CHECK_KEY_ENV) : parse(readFileSync(CHECK_KEY_FILE, "utf8"), CHECK_KEY_FILE);
}

/** The key this machine signs with: the main key on the main machine, the check key on the runner. */
export function signingKey(): KeyPair {
  const r = role();
  if (r === "none") throw new Error("this machine holds no Calopteryx key, so nothing can be signed here.");
  return r === "main" ? mainKey() : checkKey();
}

/** True when the working directory is Calopteryx's own repository, where the check key must never be made. */
const inToolRepo = () => resolve(process.cwd()) === TOOL_ROOT;

/** Generates the main key, or with which "check" the runner's check key, once. Never overwrites; prints only the public half. */
export async function keygen(which: "main" | "check" = "main"): Promise<string> {
  if (which === "main") {
    if (hasMain()) throw new Error(`${MAIN_KEY_FILE} already exists; it is never overwritten.`);
    if (hasCheck()) throw new Error("this is the runner machine; the main key is never generated where other agents' code runs.");
  } else {
    if (hasCheck()) throw new Error("this machine already holds a check key; it is never overwritten.");
    if (hasMain() || inToolRepo()) throw new Error("the check key is generated only in the calopteryx-runner repository, never beside the main key or in Calopteryx's own repository.");
  }
  const k = await generateKeyPair();
  mkdirSync("keys", { recursive: true, mode: 0o700 });
  writeFileSync(which === "main" ? MAIN_KEY_FILE : CHECK_KEY_FILE, JSON.stringify({ publicKey: k.publicKey, privateKey: k.privateKey }), { mode: 0o600, flag: "wx" });
  return k.publicKey;
}
