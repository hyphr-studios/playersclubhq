#!/usr/bin/env python3
"""
PLAYER'S CLUB — portal key tool.

The site is served from a public repo, so anything published is readable by
anyone who knows the URL. Ledgers are therefore ENCRYPTED: the model's access
key derives the decryption key in her browser and never travels anywhere.
Without her key the published file is noise.

  python3 tools/portal_keys.py list                 # who has a ledger
  python3 tools/portal_keys.py new "Name" [--house] # mint a key + ledger
  python3 tools/portal_keys.py rekey <keyfile.json> # issue a fresh key
  python3 tools/portal_keys.py seal                 # re-encrypt from plain/
  python3 tools/portal_keys.py open <KEY>           # read one back (check)

Plaintext lives in tools/plain/ and is NEVER committed (.gitignore'd).
Edit the plaintext, run `seal`, commit the encrypted output.
"""
import json, os, sys, base64, hashlib, secrets, glob
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER  = os.path.join(ROOT, "portal", "ledger")
PLAIN   = os.path.join(ROOT, "tools", "plain")
ITERS   = 310000
ALPHA   = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"      # no O/0/I/1

def b64(b): return base64.b64encode(b).decode()
def ub64(s): return base64.b64decode(s)

def derive(key, salt):
    return hashlib.pbkdf2_hmac("sha256", key.strip().upper().encode(), salt, ITERS, 32)

def filename(key):
    return hashlib.sha256(key.strip().upper().encode()).hexdigest()[:16] + ".json"

def encrypt(key, doc):
    salt, iv = secrets.token_bytes(16), secrets.token_bytes(12)
    ct = AESGCM(derive(key, salt)).encrypt(iv, json.dumps(doc).encode(), None)
    return {"v": 1, "kdf": "PBKDF2-SHA256", "iters": ITERS,
            "salt": b64(salt), "iv": b64(iv), "ct": b64(ct)}

def decrypt(key, blob):
    pt = AESGCM(derive(key, ub64(blob["salt"]))).decrypt(
        ub64(blob["iv"]), ub64(blob["ct"]), None)
    return json.loads(pt)

def mint(name):
    slug = "".join(c for c in name.upper() if c.isalnum())[:8] or "MODEL"
    return f"PC-{slug}-" + "".join(secrets.choice(ALPHA) for _ in range(10))

def write(key, doc):
    os.makedirs(LEDGER, exist_ok=True); os.makedirs(PLAIN, exist_ok=True)
    fn = filename(key)
    json.dump(encrypt(key, doc), open(os.path.join(LEDGER, fn), "w"), indent=2)
    json.dump({"_key": key, **doc}, open(os.path.join(PLAIN, fn), "w"), indent=2, ensure_ascii=False)
    return fn

def cmd_new(args):
    house = "--house" in args
    name  = args[0]
    key   = mint("HOUSE" if house else name)
    doc = {"role": "house" if house else "model", "name": name,
           "handle": "", "since": "", "status": "House · Control Room" if house else "Model",
           "units": 0, "poolShare": 0.0, "balance": 0.0, "threshold": 100,
           "note": "", "lines": [], "statements": []}
    fn = write(key, doc)
    print(f"  {name}\n  key:    {key}\n  ledger: portal/ledger/{fn}\n\n  Edit tools/plain/{fn}, then: python3 tools/portal_keys.py seal")

def cmd_seal(_):
    n = 0
    for f in sorted(glob.glob(os.path.join(PLAIN, "*.json"))):
        doc = json.load(open(f)); key = doc.pop("_key")
        json.dump(encrypt(key, doc), open(os.path.join(LEDGER, os.path.basename(f)), "w"), indent=2)
        n += 1
    print(f"  sealed {n} ledger(s) from tools/plain/ → portal/ledger/")

def cmd_list(_):
    rows = []
    for f in sorted(glob.glob(os.path.join(PLAIN, "*.json"))):
        d = json.load(open(f))
        rows.append((d.get("name","?"), d.get("_key","?"), d.get("role","model"), d.get("units",0)))
    if not rows: print("  no plaintext found — ledgers may be sealed only"); return
    print(f"  {'NAME':<18}{'ROLE':<8}{'CU':>4}   KEY")
    for n,k,r,u in rows: print(f"  {n:<18}{r:<8}{u:>4}   {k}")

def cmd_rekey(args):
    f = os.path.join(PLAIN, os.path.basename(args[0]))
    doc = json.load(open(f)); old = doc.pop("_key")
    key = mint(doc.get("name","MODEL"))
    os.remove(os.path.join(LEDGER, filename(old))); os.remove(f)
    fn = write(key, doc)
    print(f"  {doc.get('name')}\n  old key retired\n  new key: {key}\n  ledger:  portal/ledger/{fn}")

def cmd_open(args):
    key = args[0]; p = os.path.join(LEDGER, filename(key))
    if not os.path.exists(p): print("  no ledger for that key"); return
    print(json.dumps(decrypt(key, json.load(open(p))), indent=2, ensure_ascii=False))

if __name__ == "__main__":
    cmds = {"new":cmd_new, "seal":cmd_seal, "list":cmd_list, "rekey":cmd_rekey, "open":cmd_open}
    if len(sys.argv) < 2 or sys.argv[1] not in cmds:
        print(__doc__); sys.exit(1)
    cmds[sys.argv[1]](sys.argv[2:])
