# Product site delivery plan

## Scope

Static GitHub Pages site in `docs/`. No framework, third-party runtime dependency, trackers, external fonts, or build step.

Public lineup:

- Agent Home and Agent Messaging: available early projects, documented capabilities only.
- Agent Forge and Model Router: previews; public implementations and feature contracts are not yet published.

## Acceptance

- [x] Responsive dark visual system, animated stack illustration, four product cards, interactive architecture, setup guides/copy, connector links, FAQ, and source links.
- [x] Automated structural/link checks and Chromium desktop/mobile interaction checks at 320, 390, 768, 1024, and 1440 CSS pixels.
- [x] Keyboard interactions, clipboard-denial fallback, reduced motion, and readable no-JavaScript content.
- [x] Desktop and mobile axe WCAG AA checks report zero violations. This is automated coverage, not a complete accessibility certification.
- [x] Independent source review and final static/browser validation.
- [ ] Owner enables GitHub Pages for main /docs; verify deployed bytes match the committed source.

## Deployment boundary

An authenticated SSH identity can push repository contents. The available API identities do not have repository administration access, so Pages enablement cannot be assumed from a successful push. See README.md for the exact one-time settings. Do not introduce deployment credentials, a custom domain, or unrelated infrastructure to bypass this boundary.

## Artifact policy

No generated application build is needed. Preserve source, tests and review evidence. Browser test dependencies are temporary and are removed after validation and current process/reference checks. Keep screenshots outside the source repository.
