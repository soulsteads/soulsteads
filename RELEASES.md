# Released on GitHub

[Back to the Soulsteads lineup](README.md#tools-at-a-glance)

These are early releases. Open a release for available downloads and checksums. For a source install, check out the listed tag and follow its setup guide; guides on `main` can differ.

The [offline setup planner](README.md#print-a-setup-plan) can print the requirements, downloads, and matching guide for a single tool.

## Bash installer

Clone this repository, then run the installer as your normal user. Choose one product from `--list`:

```bash
git clone https://github.com/soulsteads/soulsteads.git
cd soulsteads
bash install.sh --list
bash install.sh --dry-run workboard
bash install.sh workboard
```

The installer lists short names such as `home` and `workboard`. Older names such as `agent-home` and `agent-workboard` still work.

- **Requirements:** Bash, `curl`, `stat`, and `sha256sum` or `shasum`. Messaging, Workboard, Model Router, and Forge use prebuilt Linux x86-64 binaries and need `tar`. `--list` shows the minimum glibc version for each. On other platforms or older systems, check the tagged guide for supported source builds. Home and Skillstore use release wheels and need `uv` and an installed Python 3.11 or newer; `uv` may fetch wheel dependencies. Skillstore is tested on Linux.
- **Install location:** Commands go in `~/.local/bin` by default. Set `SOULSTEADS_BIN_DIR` to another absolute directory you own if needed. Install paths (including the wheel and `uv` tool directories) must not pass through symlinks or group/world-writable directories. Add the bin directory to `PATH` yourself if it isn't already there. The installer verifies the release asset against the SHA-256 pinned in the catalog. It doesn't invoke `sudo`, edit your shell startup files, provision databases or credentials, or start services.
- **Updates and removal:** Native binaries are never overwritten. To update one, move the current file aside, get a newer checkout, and rerun the installer. To uninstall, remove the corresponding executable from the printed bin directory. `uv` manages the Python tools; to uninstall use `uv tool uninstall soulsteads` or `uv tool uninstall soulsteads-agent-skillstore`. Keep the verified wheel in `${XDG_DATA_HOME:-$HOME/.local/share}/soulsteads/wheels` while its tool is installed; `uv` records that path. None of these steps removes product data or configuration.

Once installed, follow the matching guide below for any configuration, dependencies, and first run.

<!-- release-catalog -->
## Agent Home

Keep your agent’s identity, instructions, skills, and configuration in files you control, with local Git history.

[Agent Home setup](https://github.com/soulsteads/soulsteads-agent-home/blob/v0.3.0/README.md#get-started) · [Release v0.3.0](https://github.com/soulsteads/soulsteads-agent-home/releases/tag/v0.3.0) · Python packages

**Before you start:** Python 3.11+, Git, and a supported agent runtime to launch it.

## Agent Messaging

Use your existing coding agent from Telegram, Matrix, Mattermost, Slack, Discord, WhatsApp, or the built-in web interface.

[Agent Messaging setup](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.4.0/docs/SETUP.md#before-you-start) · [Release v0.4.0](https://github.com/soulsteads/soulsteads-agent-messaging/releases/tag/v0.4.0) · Linux x86-64 archive

**Before you start:** A supported, authenticated coding agent and connector credentials. Guided Telegram setup on Linux needs Git, Rust/Cargo, Python 3.11+, and a systemd user session. Set a nonempty sender allowlist before enabling a remote connector.

## Agent Workboard

Give agents a shared issue board with dependencies, one active claim per issue, and a dashboard people can follow.

[Agent Workboard setup](https://github.com/soulsteads/soulsteads-agent-workboard/blob/v0.3.0/README.md#quickstart) · [Release v0.3.0](https://github.com/soulsteads/soulsteads-agent-workboard/releases/tag/v0.3.0) · Linux x86-64 archive

**Before you start:** SQLite is bundled; no database server needed. A source build needs stable Rust and a C compiler.

## Model Router

Route compatible requests to existing model servers through stable aliases, per-client access rules, and shared capacity limits.

[Model Router setup](https://github.com/soulsteads/soulsteads-model-router/blob/v0.3.0/docs/SETUP.md#prerequisites) · [Release v0.3.0](https://github.com/soulsteads/soulsteads-model-router/releases/tag/v0.3.0) · Linux x86-64 archive

**Before you start:** An inference server and either Tailnet IPv4 or explicit loopback mode. A source build needs Rust/Cargo and a C toolchain.

## Agent Forge

Run one-off or recurring workflows, inspect step results, and recover carefully after an interruption.

[Agent Forge setup](https://github.com/soulsteads/soulsteads-agent-forge/blob/v0.2.0/README.md#quick-start) · [Release v0.2.0](https://github.com/soulsteads/soulsteads-agent-forge/releases/tag/v0.2.0) · Linux x86-64 archive

**Before you start:** Linux, a dedicated PostgreSQL database, and `jq` for the quickstart. Building from source also needs Rust 1.97+ and a C compiler.

## Agent Skillstore

Share reviewed, versioned Agent Skills across projects and harnesses. Preview an update before installing it and recover previous versions offline.

[Agent Skillstore setup](https://github.com/soulsteads/soulsteads-agent-skillstore/blob/v0.2.0/README.md#quickstart) · [Release v0.2.0](https://github.com/soulsteads/soulsteads-agent-skillstore/releases/tag/v0.2.0) · Python packages

**Before you start:** Python 3.11+; tested on Linux. The local quickstart needs no model account, agent harness, or Agent Home.
<!-- end-release-catalog -->
