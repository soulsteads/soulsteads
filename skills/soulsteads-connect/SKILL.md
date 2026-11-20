---
name: soulsteads-connect
description: Connect Soulsteads tools through documented interfaces.
---

# Soulsteads connection guide

Use this skill only after each selected tool works independently. A connection is an explicit configuration of one documented public interface; it is not a combined install, a shared service, a credential transfer, or proof that the connected workload is safe.

## Source boundary and human installation

1. Read this `SKILL.md` from the checkout or from the runtime's documented skill location before acting. Copying it there is optional; portable skills have no universal automatic discovery mechanism.
2. Verify each selected public checkout is on `main` at the reviewed commit below, then read its named interface documentation. If the source is at another branch or commit, the guide is missing, or the product exposes a different contract, stop and report; do not bridge the gap with private code or guessed configuration.
3. Ask for approval of the exact configuration file/host, the interface, all secret references, and the test. Do not start/restart a service, create a key, modify a native/global provider configuration, migrate a client, or send a live request without specific authorization.

| Product | Public `main` commit | Interface documentation |
| --- | --- | --- |
| Agent Home | `54851fe43a18ffe15598277c917ab9edb734db8a` | `README.md`, `docs/runtimes.md` |
| Agent Messaging | `27657bd2f59a3b943fd7b9fcb6860a82ec6946d0` | `README.md`, `docs/SETUP.md` |
| Agent Workboard | `9833be988577718aa96d21cf3be521015361b8b2` | `README.md`, `docs/operations.md` |
| Agent Forge | `cbe32ca5c7caa5563ca0aa1c15a75b68de9b2c6c` | `README.md`, `docs/operations.md` |
| Model Router | `8621acd55ad293c4140b1e58664f0fc4f5fa650d` | `README.md`, `docs/SETUP.md`, `docs/COMPATIBILITY.md` |

Agent Voice and Agent Harness have no public source to install. Agent Skillstore has a standalone source preview and setup guide; use that guide for its documented harness targets. This connection skill does not define a cross-product Skillstore integration.

## Plan every connection separately

For each requested edge, record:

- the two independently working endpoints and exact source pins;
- the documented interface and which product owns its configuration;
- the identity/access boundary (agent directory, API key, client key, connector allowlist, or operator token);
- the one scoped change, non-destructive rollback, and structural check;
- the separately approved live check and success evidence.

Do not modify an endpoint just because another endpoint passed. If the desired edge is not listed below, report that no documented combined interface was verified.

## Documented connection patterns

### Agent Home and Agent Messaging: distinguish a working directory from a managed launch

Messaging's generic `acp.agentHome` sets an existing working directory for the selected backend; it does not import a Home, translate native settings, or transfer a login. Read Messaging's `docs/SETUP.md` for backend constraints and OpenCode profile-copy incompatibility.

1. For a Home-managed ACP launch, read [Agent Home's documented native backend setup](https://github.com/soulsteads/soulsteads-agent-home/blob/54851fe43a18ffe15598277c917ab9edb734db8a/docs/runtimes.md#launch-through-messaging). It requires a separately installed, compatible native Soulsteads harness. The public Agent Harness repository is empty; if the operator does not already have that prerequisite, report this path as blocked. Do not substitute an unrelated backend or private source.
2. With that prerequisite present, verify the selected Home with `soulsteads verify <home>`. Follow the documented `acp.backends.soulsteads` command, args, workspace grant, and environment fragment. It invokes `soulsteads run <home> -- acp`; the backend `agentHome` must match `<home>/workspace`, not the canonical Home root. The fragment is not a complete connector config.
3. Preserve connector secrets as private `{env:NAME}` references and set a narrow allowlist. Keep the old config and session state. Run `soulsteads-messaging --check-config` before a restart; a changed working directory or backend identity can prevent old sessions from resuming.
4. Do not use `/clear` or `/reset` to troubleshoot continuity. They delete current session history; any deliberate deletion requires explicit approval and a retention decision.
5. With a separately approved start, use a fresh test conversation to send `/status`, a harmless allowed-user prompt, and one follow-up. Verify the reply and intended working directory. An offline check does not prove runtime behavior.

Rollback: restore the recorded configuration and stop or restart only with approval. Do not delete the Home, chat session history, or native runtime state as an implied cleanup.

### Agent/host → Agent Workboard: scoped worker access

Workboard offers a JSON CLI, one stdio MCP server process per worker, and an authenticated HTTP API. It does not configure any agent runtime for you.

1. Confirm the board independently: use the configured binary and read `workboard schema`, then inspect the intended board/project without creating a second database.
2. The operator separately registers the worker identity and issues its own key. Store the key privately in `WORKBOARD_API_KEY`; never put it in MCP JSON, issue text, logs, URLs, or a copied skill. Key creation is a durable operator action and the secret is shown once.
3. Choose exactly one documented transport:
   - **Local CLI/MCP:** use the same absolute `WORKBOARD_DB` path on the host that owns the SQLite database. For MCP, the public pattern is a separate `workboard --db <absolute-db> mcp` stdio process per worker, with its assigned key in that process environment.
   - **Remote HTTP:** set `WORKBOARD_URL` to the approved server and send the key only in `Authorization: Bearer` headers. Use HTTPS beyond localhost; never mount/share the SQLite database over a network filesystem.
4. Put the transport into the selected agent/runtime through that runtime's own documented MCP/environment configuration, after the human approves the exact file. Do not claim a generic automatic Agent Home-to-MCP mapping.
5. Verify identity and a read against the intended board. A mutation must carry the current revision/lease rules, and an idempotency key when the documented API supports it. Do not use a claim, issue creation, or dashboard login as a harmless connectivity test unless authorized.

Rollback: remove the runtime's added MCP/environment entry, then stop that worker process if authorized. Revoking its key is an operator decision; do not revoke it merely to undo a local configuration edit.

### Compatible client → Model Router: explicit provider endpoint

The Router is an OpenAI-compatible subset, not a universal provider adapter. The client owns its provider configuration; Router does not discover or rewrite it.

1. Verify Router configuration and eligible route independently. Confirm the client request shape, exact alias, and required capabilities are supported by `docs/COMPATIBILITY.md`; do not assume a client that names an OpenAI endpoint is compatible.
2. Create or select a client key through the Router's documented private credential/key mechanism. Grant only the aliases/routes required by this client. Do not reuse an operator credential for a normal client or paste any key into client configuration, source, or chat.
3. In the human-approved client-specific provider configuration, set only its approved Router base URL, secret reference, and supported model alias. Preserve the prior provider configuration and rollback path. Do not replace an existing proxy or silently migrate workloads.
4. Before live traffic, use `slotline --check-config <policy>` and confirm route health/serving qualification. Configuration validation alone is not inference proof.
5. With explicit approval, make one harmless authenticated catalog request and one bounded completion. Verify the catalog exposes the authorized alias, the completion contains actual output under that alias, and invalid/missing bearer authentication is rejected. Keep the HTTP listener protected; it has no built-in TLS.

Rollback: restore the client's prior provider endpoint/alias, then verify the client no longer sends requests to Router. Do not delete Router state or keys without the credential owner's approval.

### Agent/host → Agent Forge: deliberate operational access

Forge's public CLI, authenticated HTTP API, and stdio MCP server are its documented interfaces. It does not provide a combined Home, Messaging, Workboard, or Router installer.

1. Verify the existing Forge service and the operator-approved actor/access scope before adding any client. The Forge home, PostgreSQL database, and `FORGE_TOKEN` remain Forge/operator-owned.
2. Add the exact CLI, HTTP, or stdio MCP connection only through the selected client/runtime's own documented configuration. Supply the authorized token by a private environment variable/reference; never read it from Forge configuration, copy it into another product, or pass it as an argument.
3. Start with a read-only discovery/inspection call such as the documented snapshot/status interface. Do not register work, start a run, create a schedule, retry, cancel, reconcile, or invoke an executable plugin as a connection test.
4. If an operator later authorizes a workflow/run test, use a unique request key, inspect the actual terminal run output, and separately reconcile unknown external outcomes. Schedule creation/admission is not completion proof.

Rollback: remove the client's Forge connection configuration. Do not stop the shared service, delete schedules, or revoke an operator token to undo a client integration unless explicitly approved.

## What is not established

- No documented public combined installer configures Home, Messaging, Workboard, Forge, and Router together.
- Home does not install/authenticate a harness or transport Workboard/Forge credentials. Messaging does not copy a Home, sandbox its runtime, or migrate terminal sessions. Workboard does not execute work. Forge does not replace Workboard's issue lifecycle. Router does not host models or manage client migration.
- A Messaging local-agent exchange is not a cross-machine agent network, offline queue, or generic product-to-product bus.
- An installed package, valid configuration, active service, returned HTTP status, or dashboard view does not establish a real chat reply, model completion, harness behavior, or external-work outcome.

## Connection report

For each completed edge, report: source pins; exact configuration location changed; secret **references only**; independently verified preconditions; structural-check output; live evidence (if authorized); rollback location; and remaining untested limits. State plainly when no documented connection exists instead of proposing an undocumented combined setup.
