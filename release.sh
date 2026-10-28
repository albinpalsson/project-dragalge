#!/usr/bin/env bash
# Builds a tagged release of the app into releases/<version>/.
# Usage: ./release.sh [--dry-run]   (--dry-run builds but skips tag and push)
set -euo pipefail
cd "$(dirname "$0")"

APP=paldea-nuzlocke-guide
DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

die() { echo "error: $*" >&2; exit 1; }

# --- Preflight (no side effects) ---------------------------------------------
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not a git repository"
[[ -z "$(git status --porcelain)" ]] || die "working tree is not clean"
[[ "$(git rev-parse --abbrev-ref HEAD)" == "main" ]] || die "releases must be made from main"
git fetch origin --tags --quiet
[[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] \
    || die "main differs from origin/main; push or pull first"

# --- GA4 measurement ID ------------------------------------------------------
while true; do
    read -r -p "GA4 measurement ID (G-XXXXXXXXXX): " GA4_ID
    [[ "$GA4_ID" =~ ^G-[A-Z0-9]+$ ]] && break
    echo "Expected an ID like G-ABC123XYZ."
done

# --- Version -----------------------------------------------------------------
latest="$(git tag -l 'v[0-9]*.[0-9]*.[0-9]*' --sort=-v:refname | head -n 1)"
if [[ -n "$latest" ]]; then
    IFS=. read -r major minor patch <<<"${latest#v}"
    default="v${major}.${minor}.$((patch + 1))"
    echo "Latest release: $latest"
else
    default="v0.0.1"
fi
read -r -p "Version [$default]: " VERSION
VERSION="${VERSION:-$default}"
[[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "version must look like v1.2.3"

git rev-parse -q --verify "refs/tags/$VERSION" >/dev/null && die "tag $VERSION already exists locally"
git ls-remote --exit-code --tags origin "refs/tags/$VERSION" >/dev/null 2>&1 \
    && die "tag $VERSION already exists on origin"
[[ ! -e "releases/$VERSION" ]] || die "releases/$VERSION already exists"

echo
echo "  GA4 ID:  $GA4_ID"
echo "  Version: $VERSION"
echo "  Commit:  $(git rev-parse --short HEAD)"
echo "  Output:  releases/$VERSION"
$DRY_RUN && echo "  (dry run: no tag will be created or pushed)"
read -r -p "Continue? [y/N] " answer
[[ "$answer" == "y" || "$answer" == "Y" ]] || die "aborted"

# --- Clean, build, verify ----------------------------------------------------
clean() { rm -rf ./*/dist "$APP/.cache"; }

clean
npm run build:all
npm run lint
npm run lint --prefix "$APP"
npm run test:all

# Only the app reads the GA4 ID and version, so rebuild just the app with them.
clean_app() { rm -rf "$APP/dist" "$APP/.cache"; }
clean_app
GA4_MEASUREMENT_ID="$GA4_ID" APP_VERSION="$VERSION" npm run build --prefix "$APP"

# --- Collect output, tag, push -----------------------------------------------
mkdir -p releases
mv "$APP/dist" "releases/$VERSION"

if $DRY_RUN; then
    echo "Dry run complete: releases/$VERSION (remove it before a real release)."
    exit 0
fi

git tag -a "$VERSION" -m "Release $VERSION"
git push origin "$VERSION"
echo "Released $VERSION -> releases/$VERSION"
