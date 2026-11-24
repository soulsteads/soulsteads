<img src="docs/assets/soulsteads-logo.png" alt="Soulsteads logo" width="64" />

# Soulsteads

**Open-source tools for running AI agents on your own infrastructure.**

Keep the coding agent you already use. Take its settings with you, reach it from chat, or give several agents one board to coordinate their work. Each tool installs separately; start with what you need.

**[Tools](#tools-at-a-glance)** · [How the tools fit together](#how-the-tools-fit-together) · [Install](#install-a-tool) · [Start here](#start-here) · [Releases and setup](RELEASES.md) · [Set up with an agent](#set-up-with-an-agent)

Just exploring? [Create a local Workboard](#create-a-local-workboard) without a model or a database server.

## Tools at a glance

<!-- readme-lineup -->
- **[Agent Home](https://github.com/soulsteads/soulsteads-agent-home)** — Keep one agent’s instructions, skills, and configuration in a portable, Git-tracked home.
- **[Agent Messaging](https://github.com/soulsteads/soulsteads-agent-messaging)** — Talk to an existing coding agent from chat or the built-in web interface.
- **[Agent Workboard](https://github.com/soulsteads/soulsteads-agent-workboard)** — Coordinate issues, dependencies, and agent claims on a shared board.
- **[Model Router](https://github.com/soulsteads/soulsteads-model-router)** — Route compatible requests to existing inference servers through one endpoint.
- **[Agent Forge](https://github.com/soulsteads/soulsteads-agent-forge)** — Run and schedule workflows, then inspect their step results.
- **[Agent Skillstore](https://github.com/soulsteads/soulsteads-agent-skillstore)** — Review, install, and recover versioned agent skills.
<!-- end-readme-lineup -->

<a name="released-on-github"></a>

**[See releases and setup guides](RELEASES.md)** for downloads, checksums, and prerequisites.

## How the tools fit together

[![The agent can connect to Home, Messaging, Workboard, and Model Router. Forge runs workflows separately.](docs/assets/agent-connections.svg)](docs/assets/agent-connections.svg)

[Compact diagram](docs/assets/agent-connections-compact.svg) · [Lineup diagram](docs/assets/lineup-map.svg) · [Browse the website](https://soulsteads.github.io/soulsteads/)

For example, you can talk to a supported coding agent through **Messaging** while that agent uses **Workboard** to claim and update issues. Workboard tracks the work; the agent does it. The agent still owns its sessions and permissions, and neither tool requires the other.

**Home** prepares the agent’s configuration, and **Model Router** gives compatible clients one endpoint for model servers you already run. **Skillstore** can manage skills without Home. **Forge** runs workflows separately; its quickstart needs no agent or model.

Messaging’s `acp.agentHome` sets a working directory, not an Agent Home import. See the [connection guide](.agents/skills/soulsteads-connect/SKILL.md) for supported combinations.

## Install a tool

From a checkout of this repository, choose one product:

```bash
bash install.sh --list
bash install.sh --dry-run workboard
bash install.sh workboard
```

The script verifies the pinned release asset and installs the CLI for your user. It doesn't configure or start anything. See the [installer requirements and removal instructions](RELEASES.md#bash-installer), then follow the setup guide for your tool.

<!-- readme-start-here -->
## Start here

Try one of these tasks with a guide for the matching release.

### Create a local workboard

Track issues locally with SQLite. No model or database server needed.

- [Workboard quickstart](https://github.com/soulsteads/soulsteads-agent-workboard/blob/v0.3.0/README.md#quickstart)

### Chat with your agent

Keep your existing agent harness. Choose a Linux setup guide:

- [Telegram setup](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.4.0/docs/SETUP.md#telegram) — Guided setup on Linux for Claude Code or Codex.
- [Mattermost setup](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.4.0/docs/MATTERMOST.md) — Manual Linux setup with a dedicated bot.
- [Matrix setup](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.4.0/docs/MATRIX.md) — Manual Linux setup in an unencrypted room.

### Run your first Forge workflow

Run and schedule a sample workflow. Use a dedicated PostgreSQL database, not production. No model or agent harness needed.

- [Forge quickstart](https://github.com/soulsteads/soulsteads-agent-forge/blob/v0.2.0/README.md#quick-start)

### Preview a Hermes import

Use Agent Home to inspect a Hermes import in read-only mode. No files in the source are changed.

- [Hermes import guide](https://github.com/soulsteads/soulsteads-agent-home/blob/v0.3.0/docs/hermes-import.md)

<!-- end-readme-start-here -->

## Print a setup plan

Use Node.js 24 or later to print a plan for one tool. No Node.js? Follow the [tagged setup guides](RELEASES.md).

```sh
git clone https://github.com/soulsteads/soulsteads.git
cd soulsteads
node scripts/setup.mjs
node scripts/setup.mjs agent-workboard
```

With no argument, the script lists the tools. With a tool name, it prints requirements, release downloads, and the matching guide. It works offline and does not install anything, write configuration, or start services. Verify the checksum before installing a download.

## Set up with an agent

| Skill | Use it to |
| --- | --- |
| [**soulsteads-setup**](.agents/skills/soulsteads-setup/SKILL.md) | Select one public tool, check the reviewed source and prerequisites, prepare it, and distinguish local checks from live success. |
| [**soulsteads-connect**](.agents/skills/soulsteads-connect/SKILL.md) | Connect tools that already work independently, using their documented interfaces and keeping each change reversible. |

Both skills live in `.agents/skills/`. In a Git checkout with symlinks enabled, `.claude` and `.codex` point to `.agents`, so the aliases use the same files. Review the skill first, then ask your agent to read it from the checkout or copy it to your agent’s documented skills location.

> Help me set up one Soulsteads tool. Read `.agents/skills/soulsteads-setup/SKILL.md` from `soulsteads/soulsteads` and ask which tool I want. Show me the plan before making changes. Keep credentials out of chat and Git. Ask before starting services or making live requests, and report what was actually verified.

The tools do not share a database. Connecting tools does not create an agent network. Home and Messaging do not sandbox an agent. Keep credentials out of tracked files, and review each tool’s access limits before connecting it to a network or chat account.

<a name="maintain-this-lineup"></a>

[Maintain this lineup](MAINTAIN.md)
