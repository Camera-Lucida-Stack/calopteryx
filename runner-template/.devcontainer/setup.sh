#!/usr/bin/env bash
# Sets up the runner Codespace: fetches Calopteryx's tool and the Ecdysis platform's code beside this repository, installs
# them, runs Calopteryx's tests, and confirms that no main key is anywhere on this machine. It creates no keys: the check
# key is generated here by hand (npm run cx -- keygen --check) and authorised with the main key from the main machine.
set -euo pipefail
cd "$(dirname "$0")/.."

for pair in "Camera-Lucida-Stack/calopteryx ../calopteryx" "djhulme1/ecdysis-core ../ecdysis-core"; do
  set -- $pair
  if [ ! -d "$2/.git" ]; then git clone --quiet "https://github.com/$1" "$2"
  elif [ -z "$(git -C "$2" status --porcelain)" ]; then git -C "$2" pull --quiet --ff-only
  else echo "Note: $2 has local changes, so it was not updated."; fi
done
(cd ../ecdysis-core && npm ci --ignore-scripts --no-audit --no-fund --silent)
(cd ../calopteryx && npm ci --no-audit --no-fund --silent && npm test)

if find . ../calopteryx -name main.key.json -path '*keys*' 2>/dev/null | grep -q .; then
  echo "STOP: a main key is on the runner machine. The charter forbids it; remove it before running anything." >&2
  exit 1
fi
docker run --rm --network none "$CALOPTERYX_PY_IMAGE" python -c "import sys; print('Pinned Python', sys.version.split()[0], 'runs.')"
echo
echo "Runner set up. $(npm run -s cx -- role)"
echo "Tool: calopteryx at $(git -C ../calopteryx rev-parse --short HEAD); platform: ecdysis-core at $(git -C ../ecdysis-core rev-parse --short HEAD)."
