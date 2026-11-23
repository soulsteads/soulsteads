<img src="docs/assets/soulsteads-logo.png" alt="Soulsteads logo" width="64" />

# Soulsteads

**Open-source tools for running AI agents on your own infrastructure.**

Keep the coding agent you already use. Add only the tools you need; each installs separately.

**[Start here](#start-here)** · [Tools and releases](#released-on-github) · [Set up with an agent](#set-up-with-an-agent)

## How the tools fit together

[![Your agent harness can connect to Home, Messaging, Workboard, and Model Router. Forge runs workflows separately.](docs/assets/agent-connections.svg)](docs/assets/agent-connections.svg)

[Compact diagram](docs/assets/agent-connections-compact.svg)

- **Home** generates native configuration for your harness, which still owns sessions and permissions.
- **Messaging** bridges chat to your harness. `acp.agentHome` sets a working directory, not an Agent Home import.
- **Workboard** coordinates issues and claims via MCP, CLI, or HTTP; it doesn't execute work.
- **Model Router** sends requests from compatible clients to inference servers you already run.
- **Forge** runs and tracks workflows on demand or on a schedule. Its quick start needs no model or harness.

<!-- readme-start-here -->
## Start here

Pick one task and follow its guide. You’ll build from source, not download a binary. Preview links point to exact reviewed commits.

### Create a local workboard

*Agent Workboard · Tagged source v0.1.0*

Track issues locally with SQLite. No model or database server needed.

- [Workboard quickstart](https://github.com/soulsteads/soulsteads-agent-workboard/blob/v0.1.0/README.md#quickstart)

### Chat with your agent

*Agent Messaging · Tagged source v0.2.0*

Keep your existing agent harness. Choose a Linux setup guide:

- [Telegram setup](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.2.0/docs/SETUP.md#telegram) — Guided setup on Linux for Claude Code or Codex.
- [Mattermost setup](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.2.0/docs/MATTERMOST.md) — Manual Linux setup with a dedicated bot.
- [Matrix setup](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.2.0/docs/MATRIX.md) — Manual Linux setup in an unencrypted room.

### Run your first Forge workflow

*Agent Forge · Source preview*

Run and schedule a sample workflow. Use a dedicated PostgreSQL database, not production. No model or agent harness needed.

- [Forge source preview guide](https://github.com/soulsteads/soulsteads-agent-forge/blob/9bcc307946730ac5c00c1a5552790504ba2fea4a/README.md)

### Preview a Hermes import

*Agent Home · Source preview*

Use Agent Home to inspect a Hermes import in read-only mode. No files in the source are changed.

- [Hermes import guide](https://github.com/soulsteads/soulsteads-agent-home/blob/31d1fc26fe210d82fd414780a4aeae78efea185f/docs/hermes-import.md)

<!-- end-readme-start-here -->
<!-- readme-lineup -->

## Released on GitHub

These are early, **source-only releases**: no prebuilt binaries. Check out the tag before following its setup guide; the guides and features on `main` can differ.

| Tool | Release | Use it to | What you need / setup |
| --- | --- | --- | --- |
| **Agent Home** | [v0.1.0](https://github.com/soulsteads/soulsteads-agent-home/releases/tag/v0.1.0) | Keep one agent’s instructions, skills, and configuration in a portable, Git-tracked home. | Python 3.11+, Git, and a supported agent runtime to launch it. [Setup at v0.1.0](https://github.com/soulsteads/soulsteads-agent-home/blob/v0.1.0/README.md#other-installation-options) |
| **Agent Messaging** | [v0.2.0](https://github.com/soulsteads/soulsteads-agent-messaging/releases/tag/v0.2.0) | Talk to an existing coding agent from chat or the built-in web interface. | Rust/Cargo, Git, an authenticated coding agent, and connector credentials as needed. Set a nonempty sender allowlist (`allowedUsers`) before enabling a remote connector. [Setup at v0.2.0](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.2.0/docs/SETUP.md#before-you-start) |
| **Agent Workboard** | [v0.1.0](https://github.com/soulsteads/soulsteads-agent-workboard/releases/tag/v0.1.0) | Coordinate issues, dependencies, and agent claims on a shared board. | Stable Rust and a C compiler. SQLite is bundled. [Setup at v0.1.0](https://github.com/soulsteads/soulsteads-agent-workboard/blob/v0.1.0/README.md#quickstart) |
| **Model Router** | [v0.1.0](https://github.com/soulsteads/soulsteads-model-router/releases/tag/v0.1.0) | Route compatible requests to existing inference servers through one endpoint. | Linux, Rust/Cargo, a C toolchain, an inference server, and Tailnet IPv4. Loopback listeners are documented on `main`, not in this tag. [Setup at v0.1.0](https://github.com/soulsteads/soulsteads-model-router/blob/v0.1.0/docs/SETUP.md#prerequisites) |

### Public source preview

- **[Agent Forge](https://github.com/soulsteads/soulsteads-agent-forge/tree/9bcc307946730ac5c00c1a5552790504ba2fea4a)** — Run one-off or recurring workflows, inspect step results, and recover carefully after an interruption. No tagged release; for evaluation.
  **What you need:** Linux, Rust 1.97 or later, and a C compiler · An empty, dedicated PostgreSQL database for DBOS · `jq` for the upstream quick-start example. [Run the first workflow](https://github.com/soulsteads/soulsteads-agent-forge#quick-start) · [Requirements and verification](https://github.com/soulsteads/soulsteads-agent-forge/blob/main/docs/support.md)
- **[Agent Skillstore](https://github.com/soulsteads/soulsteads-agent-skillstore/tree/7b24bb6eaf566ab004b6b30591a5369a6a4ec53a)** — Share reviewed, versioned Agent Skills across projects and harnesses. Preview an update before installing it and recover previous versions offline. No tagged release; for evaluation.
  **What you need:** A source checkout, Python 3.11 or later, and `uv` or `pip`. [Install Skillstore from source](https://github.com/soulsteads/soulsteads-agent-skillstore/blob/7b24bb6eaf566ab004b6b30591a5369a6a4ec53a/README.md#install-from-source) · [Try the local quickstart](https://github.com/soulsteads/soulsteads-agent-skillstore/blob/7b24bb6eaf566ab004b6b30591a5369a6a4ec53a/README.md#quickstart) · [Back up skills without a registry](https://github.com/soulsteads/soulsteads-agent-skillstore/blob/7b24bb6eaf566ab004b6b30591a5369a6a4ec53a/docs/usage.md#tracking-only-mode)

Public source and releases checked on GitHub: **2026-11-19**.

<!-- end-readme-lineup -->

**[Browse the website](https://soulsteads.github.io/soulsteads/)** · **[Set up with an agent](#set-up-with-an-agent)** · **[See the lineup diagram](docs/assets/lineup-map.svg)**

## Set up with an agent

| Skill | Use it to |
| --- | --- |
| [**soulsteads-setup**](.agents/skills/soulsteads-setup/SKILL.md) | Select one public tool, check the reviewed source and prerequisites, prepare it, and distinguish local checks from live success. |
| [**soulsteads-connect**](.agents/skills/soulsteads-connect/SKILL.md) | Connect tools that already work independently, using their documented interfaces and keeping each change reversible. |

Both skills live in `.agents/skills/`. In a Git checkout with symlinks enabled, `.claude` and `.codex` point to `.agents`, so the aliases use the same files. Review the skill first, then ask your agent to read it from the checkout or copy it to your agent’s documented skills location.

> Help me set up one Soulsteads tool. Read `.agents/skills/soulsteads-setup/SKILL.md` from `soulsteads/soulsteads` and ask which tool I want. Show me the plan before making changes. Keep credentials out of chat and Git. Ask before starting services or making live requests, and report what was actually verified.

There is no shared installer or database. Connecting tools does not create an agent network. Home and Messaging do not sandbox an agent. Keep credentials out of tracked files, and review each tool’s access limits before connecting it to a network or chat account.

## Maintain this lineup

This repository contains the website, public product catalog, diagrams, and setup skills—not the product binaries. Product code and issue trackers live in the linked repositories. See [LICENSE](LICENSE) for this repository’s license.

Edit [`data/products.json`](data/products.json) and update the setup skill’s source pins when reviewing a new GitHub snapshot. Verify tagged guides at their tags, not on `main`. Update the SVGs if the lineup or connection boundaries change. Regenerate the README and site sections, then run the checks:

```sh
node scripts/render-lineup.mjs
node --test tests/*.test.mjs
```

GitHub Pages serves `docs/` directly. The site has no runtime build, tracking scripts, or third-party requests.
