<img src="docs/assets/soulsteads-logo.png" alt="Soulsteads logo" width="64" />

# Soulsteads

**Your agents. On your terms.**

Fast. Less baggage. No BS.

Build an agent stack that works for you. Give your agents a home, bring them into your chat, and keep the pieces you want.

**[Explore the Soulsteads lineup →](https://soulsteads.github.io/soulsteads/#products)**

## The lineup

- **[Agent Home](https://github.com/soulsteads/soulsteads-agent-home)** — A portable home for your agents, with identity and history.
- **[Agent Messaging](https://github.com/soulsteads/soulsteads-agent-messaging)** — Bring coding agents into your chat. Available as an early release.
- **[Agent Forge](https://github.com/soulsteads/soulsteads-agent-forge)** — Part of the upcoming lineup. Preview only; no public implementation yet.
- **[Model Router](https://github.com/soulsteads/soulsteads-model-router)** — A Rust gateway for routing OpenAI-compatible requests across your own inference servers, with stable aliases, capability checks, and shared capacity limits. Early release; builds as `slotline`.

Visit the [Soulsteads website](https://soulsteads.github.io/soulsteads/) to explore the products, see what's available, and get started.

## Route your local models

Model Router gives compatible clients one endpoint for existing inference servers.
It does not host models or manage loading, and it is not a universal OpenAI drop-in.
Use the [setup guide](https://github.com/soulsteads/soulsteads-model-router/blob/main/docs/SETUP.md)
and [compatibility guide](https://github.com/soulsteads/soulsteads-model-router/blob/main/docs/COMPATIBILITY.md)
before connecting clients.

You need a Linux/Unix host, an existing inference server, and an assigned Tailnet
IPv4 address. The listener rejects loopback, LAN, and wildcard binds and reserves
port `4001`. It serves HTTP without built-in TLS; keep it on a protected network,
not exposed directly to the internet. No model server or prebuilt binary is bundled.
The project's release notes still require a Git-history privacy review before
public-release qualification; published source is not a claim that every release
gate or backend combination is qualified.

Home, Messaging, and Model Router are independent tools. Installing one does not
configure another, migrate clients, or start a service.
