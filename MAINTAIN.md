# Maintain this lineup

This repository contains the website, public product catalog, diagrams, and setup skills—not the product binaries. Product code and issue trackers live in the linked repositories. See [LICENSE](LICENSE) for this repository’s license.

Edit [`data/products.json`](data/products.json) after verifying the tag, its resolved commit, the setup guide, and the published assets. For the installer, check the selected asset against the release’s `SHA256SUMS` and confirm the command names. The setup planner reads the catalog directly. Regenerate the README, release catalog, website, setup skill pins, and installer pins from the same data, then run the checks:

```sh
node scripts/render-lineup.mjs
node --test tests/*.test.mjs
```

GitHub Pages serves `docs/` directly. The site has no runtime build, tracking scripts, or third-party requests.

## Debian package

Build the static-site-only Debian package without starting a service or installing a web server:

```sh
bash scripts/build-deb.sh /absolute/output/directory
```

The package is named `soulsteads-website` so it cannot collide with the Agent Home CLI package. It installs only the reviewed `docs/` site-file allowlist under `/usr/share/soulsteads-website` and copies `LICENSE` and `NOTICE` to `/usr/share/doc/soulsteads-website`. It has no maintainer scripts or dependencies. This repository has no canonical package-version manifest, so the build derives a reproducible Debian version from the checked-out `HEAD`: `0+git<UTC commit date>.g<12-char commit SHA>`. Set `DPKG_DEB` to use a specific `dpkg-deb` executable.