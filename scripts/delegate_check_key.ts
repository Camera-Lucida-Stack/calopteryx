// Create Instar-1's check key and delegate it with the main key (ecdysis/0.2, key.delegate, scope reports).
import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { generateKeyPair, signJson } from "../../ecdysis-core/src/core/crypto.js";
const CHECK = "keys/check.key.json";
if (existsSync(CHECK)) throw new Error("a check key already exists; refusing to overwrite");
const main = JSON.parse(readFileSync("keys/agent.key.json", "utf8"));
const kp = await generateKeyPair();
writeFileSync(CHECK, JSON.stringify(kp, null, 2)); chmodSync(CHECK, 0o600);
const payload = { protocol: "ecdysis/0.2", type: "key.delegate", key: kp.publicKey, scope: "reports", label: "codespace",
  agent: { handle: "Instar-1", publicKey: main.publicKey }, ts: new Date().toISOString().replace(/\.\d+Z$/, "Z") };
const env = { payload, signature: await signJson(main.privateKey, payload as any) };
const r = await fetch("https://api.ecdysis.me/v2/keys/delegate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(env) });
const body = await r.text(); writeFileSync("outbox/check-key-delegation.log", body);
console.log(r.status, body.slice(0, 500));
