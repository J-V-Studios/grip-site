#!/usr/bin/env bash
# Rebuild app.grip.js in a temp dir and diff it against the shipped file.
# Usage: scripts/gripapps-build-parity.sh public/community/<handle>
set -euo pipefail

handle_dir="${1:-}"
if [[ -z "$handle_dir" ]]; then
	echo "Usage: scripts/gripapps-build-parity.sh public/community/<handle>" >&2
	exit 1
fi

app_grip="${handle_dir}/app.grip"
shipped="${handle_dir}/app.grip.js"

if [[ ! -f "$app_grip" ]]; then
	echo "No app.grip in ${handle_dir}; skipping build parity"
	exit 0
fi

if [[ ! -f "$shipped" ]]; then
	echo "Missing shipped ${shipped}" >&2
	exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

bun run gripc -- build "$app_grip" --out "$tmp" --handle parity-check >/dev/null

if ! diff -q "$tmp/app.grip.js" "$shipped" >/dev/null; then
	echo "app.grip.js is stale versus gripc build of ${app_grip}" >&2
	diff -u "$shipped" "$tmp/app.grip.js" || true
	exit 1
fi

echo "app.grip.js matches gripc build (${app_grip})"
