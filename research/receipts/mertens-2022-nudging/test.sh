#!/bin/sh
# Runs test_run.R in the pinned image, sealed as the reference runner seals a bundle (no network, read-only root and
# checkout, a 1 GB /tmp, 4 GB of memory, 2 CPUs). Argument: the authors' mhhb_nma_analysis.R, downloaded from
# https://osf.io/download/eq4wm/ and checked against its SHA-256 below. No real data are used.
set -eu
IMAGE="rocker/tidyverse:4.1.2@sha256:879098acd5a8277f3c368a1e2c431019d00d952959a588da12cdaaee9d968b8b"
SCRIPT="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
echo "bb04177e9217600af17ec5a243b002729573e9ff67037673b24c27c07d92b7fc  $SCRIPT" | sha256sum -c - >/dev/null || { echo "not the authors' script"; exit 1; }
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
exec docker run --rm --network none --read-only --tmpfs /tmp:rw,size=1g --memory 4g --cpus 2 --pids-limit 256 \
  -u "$(id -u):$(id -g)" --env HOME=/tmp -v "$ROOT:/work:ro" -v "$SCRIPT:/script/mhhb_nma_analysis.R:ro" -w /work \
  "$IMAGE" Rscript research/receipts/mertens-2022-nudging/test_run.R /script/mhhb_nma_analysis.R
