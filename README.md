# Soulsteads

**Your agents. On your terms. Fast. Less baggage. No BS.**

The public product site for the Soulsteads lineup. Open `docs/index.html` or serve it locally:

```sh
python3 -m http.server 8080 --directory docs --bind 127.0.0.1
```

Visit http://127.0.0.1:8080. No package installation or build step is needed.

## The lineup

- [Agent Home](https://github.com/soulsteads/soulsteads-agent-home): portable agent homes, local Git history, runtime adapters and optional Hermes import.
- [Agent Messaging](https://github.com/soulsteads/soulsteads-agent-messaging): native Rust chat bridge for coding agents; early release.
- [Agent Forge](https://github.com/soulsteads/soulsteads-agent-forge): preview; public implementation not yet published.
- [Model Router](https://github.com/soulsteads/soulsteads-model-router): preview; public implementation not yet published.

The website does not make preview features available or deploy any agent infrastructure. Product availability and limitations are grounded in the linked public repositories.

## GitHub Pages

In **Settings → Pages → Build and deployment**, select **Deploy from a branch**, branch **main**, folder **/docs**, then Save. The expected project URL is https://soulsteads.github.io/soulsteads/ . No custom domain is configured. The site uses relative asset paths and works under a project path.

This repository does not require Actions permissions or a token to build the site. GitHub performs the standard branch-based Pages deployment. Enabling Pages requires repository administration permission; SSH push access alone cannot change the Pages setting.

## Check changes

```sh
node --test tests/*.test.mjs
node --check docs/assets/site.js
```

`tests/browser.mjs` is an optional Playwright integration suite. Install `playwright` and `@axe-core/playwright` into an external temporary directory and set `SITE_QA_MODULES` to its node_modules path; set `SITE_URL` to the running preview URL. Run `node tests/browser.mjs`. Chromium must be installed for Playwright. Screenshots and JSON evidence go to the path specified by `SITE_QA_OUTPUT` (default `/tmp/soulsteads-site-evidence`). Do not commit generated artifacts or dependencies.

The page remains readable without JavaScript. Optional interactions include mobile navigation, product filters, architecture explanations, setup selection and clipboard copying with a manual-copy fallback. Motion respects the operating system's reduced-motion preference. No third-party scripts, external fonts, analytics, cookies, or client storage.
