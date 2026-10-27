#!/usr/bin/env bash
# Validates community PRs: single handle sandbox, required index.html + manifest.json.
set -euo pipefail

BRANCH="${1:-${GITHUB_HEAD_REF:-}}"
BASE_SHA="${2:-${GITHUB_EVENT_PULL_REQUEST_BASE_SHA:-}}"
HEAD_SHA="${3:-${GITHUB_EVENT_PULL_REQUEST_HEAD_SHA:-}}"

die() {
	echo "::error::$*"
	exit 1
}

if [[ -z "$BRANCH" || -z "$BASE_SHA" || -z "$HEAD_SHA" ]]; then
	die "Usage: community-path-guard.sh <branch> <base_sha> <head_sha> (or set GITHUB_* env vars)"
fi

if [[ "$BRANCH" != community/* ]]; then
	die "Branch must start with community/ (got: $BRANCH)"
fi

suffix="${BRANCH#community/}"
if [[ ! "$suffix" =~ ^([a-z0-9]([a-z0-9-]{1,22}[a-z0-9])?)-[0-9a-f]{8}$ ]]; then
	die "Branch must match community/<handle>-<8-char-hex-id> (got: $BRANCH)"
fi
handle="${BASH_REMATCH[1]}"

allowed_prefix="public/community/${handle}/"

mapfile -t changed_files < <(git diff --name-only "$BASE_SHA...$HEAD_SHA")
if [[ ${#changed_files[@]} -eq 0 ]]; then
	die "No changed files in PR"
fi

declare -A handles_touched=()
for file in "${changed_files[@]}"; do
	if [[ "$file" != "$allowed_prefix"* ]]; then
		die "Disallowed path (outside sandbox): $file (expected under $allowed_prefix)"
	fi
	if [[ "$file" =~ ^public/community/([^/]+)/ ]]; then
		handles_touched["${BASH_REMATCH[1]}"]=1
	fi
done

if [[ ${#handles_touched[@]} -gt 1 ]]; then
	die "More than one handle folder touched: ${!handles_touched[*]}"
fi

if [[ -z "${handles_touched[$handle]+x}" ]]; then
	die "No files under public/community/${handle}/ in this PR"
fi

index_path="public/community/${handle}/index.html"
manifest_path="public/community/${handle}/manifest.json"

if ! git cat-file -e "${HEAD_SHA}:${index_path}" 2>/dev/null; then
	die "Missing required file at PR tip: ${index_path}"
fi
if ! git cat-file -e "${HEAD_SHA}:${manifest_path}" 2>/dev/null; then
	die "Missing required file at PR tip: ${manifest_path}"
fi

index_size="$(git show "${HEAD_SHA}:${index_path}" | wc -c | tr -d ' ')"
if [[ "$index_size" -lt 1 ]]; then
	die "${index_path} is empty"
fi

echo "Path guard passed for handle: ${handle} (${#changed_files[@]} file(s) changed)"
