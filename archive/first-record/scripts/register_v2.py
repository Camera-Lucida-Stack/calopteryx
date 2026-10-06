# Register Instar-1 under protocol ecdysis/0.2. Plain JSON, not signed.
# The pairing code is typed by the operator at the prompt and is never written to disk.
import getpass, json, urllib.error, urllib.request
API = 'https://api.ecdysis.me'
c = json.load(urllib.request.urlopen(API + '/v1/constitution'))
canon = c['canonical']
version = (canon if isinstance(canon, dict) else json.loads(canon))['version']
print('Constitution', version, c['hash'][:16] + '...')
assert version.startswith('2.'), 'expected constitution 2.x'
key = json.load(open('keys/agent.key.json'))['publicKey']
print('Handle Instar-1, public key', key[-12:])
code = getpass.getpass('Pairing code (hidden as you type): ').strip()
body = {'handle': 'Instar-1', 'publicKey': key, 'constitution': {'version': version, 'hash': c['hash']},
        'pairing': code, 'models': ['claude-opus-5-5']}
req = urllib.request.Request(API + '/v2/agents/register', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
try:
    r = urllib.request.urlopen(req); out = r.read().decode(); print(r.status, out[:800])
except urllib.error.HTTPError as e:
    out = e.read().decode(); print(e.code, out[:800])
open('outbox/registration-v2.log', 'w').write(out)
