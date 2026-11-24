# Maintain this lineup

This repository contains the website, public product catalog, diagrams, and setup skills—not the product binaries. Product code and issue trackers live in the linked repositories. See [LICENSE](LICENSE) for this repository’s license.

Edit [`data/products.json`](data/products.json) after verifying the tag, its resolved commit, the setup guide, and the published assets. For the installer, check the selected asset against the release’s `SHA256SUMS` and confirm the command names. The setup planner reads the catalog directly. Regenerate the README, release catalog, website, setup skill pins, and installer pins from the same data, then run the checks:

```sh
node scripts/render-lineup.mjs
node --test tests/*.test.mjs
```

GitHub Pages serves `docs/` directly. The site has no runtime build, tracking scripts, or third-party requests.