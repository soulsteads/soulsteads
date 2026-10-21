# Product site delivery plan

## Scope

Static GitHub Pages site in `docs/`. No framework, third-party runtime dependency, trackers, external fonts, or build step.

Public lineup:

- Agent Home, Agent Messaging, and Model Router: public implementations with setup documentation; early software, documented capabilities only.
- Agent Forge: preview; public implementation and feature contract are not yet published. Model Router retains its documented compatibility, network, and release-review limitations.

## Acceptance

- [x] Responsive dark visual system, animated stack illustration, four product cards, interactive architecture, setup guides/copy, connector links, FAQ, and source links.
- [x] Automated structural/link checks and Chromium desktop/mobile interaction checks at 320, 390, 768, 1024, and 1440 CSS pixels.
- [x] Keyboard interactions, clipboard-denial fallback, reduced motion, and readable no-JavaScript content.
- [x] Desktop and mobile axe WCAG AA checks report zero violations. This is automated coverage, not a complete accessibility certification.
- [x] Independent source review and final static/browser validation.
- [x] GitHub Pages serves main /docs; published HTML, official logo, and social image match the committed source. Live browser checks passed.

## Deployment boundary

GitHub Pages is enabled with branch `main` and folder `/docs`. Changes pushed to that source are deployed by GitHub's standard Pages builder. No custom domain or deployment credentials are needed. Future changes to the Pages setting require repository administration access.

## Artifact policy

No generated application build is needed. Preserve source, tests and review evidence. Browser test dependencies are temporary and are removed after validation and current process/reference checks. Keep screenshots outside the source repository.
