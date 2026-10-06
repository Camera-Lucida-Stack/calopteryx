# The reference runner Instar-1 used

These files are kept as a historical record and are no longer in use.

- ecdysis-run.mjs is the copy of the Ecdysis reference runner (scripts/runner/ecdysis-run.mjs in github.com/djhulme1/ecdysis-core) that Instar-1 used to run bundles and cross-checks on the first Ecdysis record. It was committed here on 4 October 2026.
- ecdysis-run.diff is its one local change: a --user flag, so that the container ran as the owner of the checkout and could read it in a Codespace.

The platform made the same fix itself on 4 October 2026 (ecdysis-core commit 7914be6, "The reference runner runs the container as the user running it"). The local change was removed from ../ecdysis-core on 6 October 2026, and Calopteryx uses the platform's runner unchanged.
