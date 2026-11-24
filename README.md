<img src="docs/assets/soulsteads-logo.png" alt="Soulsteads logo" width="64" />

# Soulsteads

**Open-source tools for running AI agents on your own infrastructure.**

Keep the coding agent you already use. Add only the tools you need; each installs separately.

**[Start here](#start-here)** · [Tools and releases](#released-on-github) · [Print a setup plan](#print-a-setup-plan) · [Set up with an agent](#set-up-with-an-agent)

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

Pick one task and follow its guide. Use the release catalog below to find downloads or build from the matching tag.

### Create a local workboard

*Agent Workboard · Tagged source v0.3.0*

Track issues locally with SQLite. No model or database server needed.

- [Workboard quickstart](https://github.com/soulsteads/soulsteads-agent-workboard/blob/v0.3.0/README.md#quickstart)

### Chat with your agent

*Agent Messaging · Tagged source v0.4.0*

Keep your existing agent harness. Choose a Linux setup guide:

- [Telegram setup](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.4.0/docs/SETUP.md#telegram) — Guided setup on Linux for Claude Code or Codex.
- [Mattermost setup](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.4.0/docs/MATTERMOST.md) — Manual Linux setup with a dedicated bot.
- [Matrix setup](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.4.0/docs/MATRIX.md) — Manual Linux setup in an unencrypted room.

### Run your first Forge workflow

*Agent Forge · Tagged source v0.2.0*

Run and schedule a sample workflow. Use a dedicated PostgreSQL database, not production. No model or agent harness needed.

- [Forge quickstart](https://github.com/soulsteads/soulsteads-agent-forge/blob/v0.2.0/README.md#quick-start)

### Preview a Hermes import

*Agent Home · Tagged source v0.1.0*

Use Agent Home to inspect a Hermes import in read-only mode. No files in the source are changed.

- [Hermes import guide](https://github.com/soulsteads/soulsteads-agent-home/blob/v0.1.0/docs/hermes-import.md)

<!-- end-readme-start-here -->
<!-- readme-lineup -->

## Released on GitHub

These are early releases. Use the release link for downloads and checksums, or check out the tag to install from source. Guides on `main` can differ from the tagged instructions.

| Tool | Release | Use it to | What you need / setup |
| --- | --- | --- | --- |
| **Agent Home** | [v0.1.0](https://github.com/soulsteads/soulsteads-agent-home/releases/tag/v0.1.0) · Source only | Keep one agent’s instructions, skills, and configuration in a portable, Git-tracked home. | Python 3.11+, Git, and a supported agent runtime to launch it. [Setup at v0.1.0](https://github.com/soulsteads/soulsteads-agent-home/blob/v0.1.0/README.md#other-installation-options) |
| **Agent Messaging** | [v0.4.0](https://github.com/soulsteads/soulsteads-agent-messaging/releases/tag/v0.4.0) · Linux x86-64 archive | Talk to an existing coding agent from chat or the built-in web interface. | A supported, authenticated coding agent and connector credentials. Guided Telegram setup on Linux needs Git, Rust/Cargo, Python 3.11+, and a systemd user session. Set a nonempty sender allowlist before enabling a remote connector. [Setup at v0.4.0](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.4.0/docs/SETUP.md#before-you-start) |
| **Agent Workboard** | [v0.3.0](https://github.com/soulsteads/soulsteads-agent-workboard/releases/tag/v0.3.0) · Linux x86-64 archive | Coordinate issues, dependencies, and agent claims on a shared board. | SQLite is bundled; no database server needed. A source build needs stable Rust and a C compiler. [Setup at v0.3.0](https://github.com/soulsteads/soulsteads-agent-workboard/blob/v0.3.0/README.md#quickstart) |
| **Model Router** | [v0.3.0](https://github.com/soulsteads/soulsteads-model-router/releases/tag/v0.3.0) · Linux x86-64 archive | Route compatible requests to existing inference servers through one endpoint. | An inference server and either Tailnet IPv4 or explicit loopback mode. A source build needs Rust/Cargo and a C toolchain. [Setup at v0.3.0](https://github.com/soulsteads/soulsteads-model-router/blob/v0.3.0/docs/SETUP.md#prerequisites) |
| **Agent Forge** | [v0.2.0](https://github.com/soulsteads/soulsteads-agent-forge/releases/tag/v0.2.0) · Linux x86-64 archive | Run and schedule workflows, then inspect their step results. | Linux, a dedicated PostgreSQL database, and `jq` for the quickstart. Building from source also needs Rust 1.97+ and a C compiler. [Setup at v0.2.0](https://github.com/soulsteads/soulsteads-agent-forge/blob/v0.2.0/README.md#quick-start) |
| **Agent Skillstore** | [v0.2.0](https://github.com/soulsteads/soulsteads-agent-skillstore/releases/tag/v0.2.0) · Python packages | Review, install, and recover versioned agent skills. | Python 3.11+; tested on Linux. The local quickstart needs no model account, agent harness, or Agent Home. [Setup at v0.2.0](https://github.com/soulsteads/soulsteads-agent-skillstore/blob/v0.2.0/README.md#quickstart) |

<!-- end-readme-lineup -->

**[Browse the website](https://soulsteads.github.io/soulsteads/)** · **[Set up with an agent](#set-up-with-an-agent)** · **[See the lineup diagram](docs/assets/lineup-map.svg)**

## Print a setup plan

Start with one tool. From a checkout of this repository with Node.js 24 or later:

```sh
git clone https://github.com/soulsteads/soulsteads.git
cd soulsteads
node scripts/setup.mjs
node scripts/setup.mjs agent-workboard
```

The first command using Node lists all tools. The second prints requirements, release and setup links, and available downloads for Workboard. Verify the checksum before installing a release asset, then follow the matching guide. The script makes no network requests and does not install software, write configuration, or start services. You can use the release table directly without Node.js.

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

Edit [`data/products.json`](data/products.json) after verifying the tag, its resolved commit, the setup guide, and the published asset list. The setup planner reads that catalog directly; regenerate the README, website, and setup skill pins from the same data, then run the checks:

```sh
node scripts/render-lineup.mjs
node --test tests/*.test.mjs
```

GitHub Pages serves `docs/` directly. The site has no runtime build, tracking scripts, or third-party requests.
