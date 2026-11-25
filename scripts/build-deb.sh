#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
output_dir=${1:-"$root/dist"}
dpkg_deb=${DPKG_DEB:-dpkg-deb}

for command in git install mktemp "$dpkg_deb"; do
  command -v "$command" >/dev/null 2>&1 || {
    printf 'required command not found: %s\n' "$command" >&2
    exit 127
  }
done

git -C "$root" rev-parse --is-inside-work-tree >/dev/null
commit_date=$(TZ=UTC git -C "$root" show -s --format=%cd --date=format:%Y%m%d HEAD)
commit_sha=$(git -C "$root" rev-parse --verify HEAD)
version="0+git${commit_date}.g${commit_sha:0:12}"
package="soulsteads-website"
mkdir -p -- "$output_dir"
output_dir=$(cd -- "$output_dir" && pwd)
work=$(mktemp -d "$output_dir/.deb-build.XXXXXX")
trap 'rm -rf -- "$work"' EXIT
staging="$work/pkg"

site_files=(
  .nojekyll
  404.html
  assets/agent-connections-compact.svg
  assets/agent-connections.svg
  assets/lineup-map.svg
  assets/site.js
  assets/social.png
  assets/social.svg
  assets/soulsteads-logo.png
  assets/style.css
  index.html
  llms.txt
  robots.txt
  sitemap.xml
)

install -d -m 0755 "$staging/DEBIAN" "$staging/usr/share/$package" "$staging/usr/share/doc/$package"
chmod 0755 "$staging" "$staging/usr" "$staging/usr/share" "$staging/usr/share/doc"
cat >"$staging/DEBIAN/control" <<EOF
Package: $package
Version: $version
Architecture: all
Section: web
Priority: optional
Maintainer: Soulsteads
Homepage: https://soulsteads.github.io/soulsteads/
Description: Soulsteads static website
 Static files for the Soulsteads public website. This package does not install
 or configure a web server.
EOF

for file in "${site_files[@]}"; do
  source_file="$root/docs/$file"
  test -f "$source_file" || {
    printf 'allowlisted site file is missing: %s\n' "$file" >&2
    exit 1
  }
  install -D -m 0644 "$source_file" "$staging/usr/share/$package/$file"
done
install -m 0644 "$root/LICENSE" "$staging/usr/share/doc/$package/LICENSE"
install -m 0644 "$root/NOTICE" "$staging/usr/share/doc/$package/NOTICE"

artifact="$output_dir/${package}_${version}_all.deb"
"$dpkg_deb" --root-owner-group -Zxz --build "$staging" "$work/package.deb" >/dev/null
mv -fT -- "$work/package.deb" "$artifact"
printf '%s\n' "$artifact"
