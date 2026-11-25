# Move a Hermes profile to an isolated Mattermost test

This is a side-by-side migration, not a cutover. Keep Hermes, its credentials, conversations, and schedules running under their current owners. Plan the import, harness configuration, and connector separately. Use the reviewed release pins in the [setup skill](../SKILL.md); a fix on a PR or on `main` is not a released capability.

## 1. Inspect the definition without writing a Home

Install Agent Home with its `hermes` extra using the [tagged import guide](https://github.com/soulsteads/soulsteads-agent-home/blob/v0.3.0/docs/hermes-import.md). Select one profile, one installed/qualified target harness, and a new owner-only destination outside a public checkout. For example, with OpenCode:

```sh
soulsteads import-hermes coding-test --source "$HOME/.hermes" \
  --profile coding --runtime opencode --platform mattermost \
  --path "$HOME/.soulsteads/agents/coding-test"
```

`--source` is the parent Hermes home, not `profiles/coding`. For a standalone owner-reviewed snapshot rooted at the selected profile, use `--source <snapshot> --profile default`. `--platform mattermost` selects a skill filter; it does not connect a bot. Only supply `--workspace` for a separately approved root whose identity files you intend to import. Track whether identity came from the profile, workspace, or templates.

If inspection refuses, distinguish unsafe ancestor permissions, configuration parsing, and skill/asset refusal from a successful report with manual work. Check the lexical source path and its ancestors, not just the leaf. Do not recursively change a live profile's permissions, follow links, or use `--allow-partial` to get around a refusal. If an owner prepares a private snapshot, document every omission and its effect before importing; a filtered snapshot does not prove direct or complete migration. Never copy the whole profile as a workaround.

If Hermes disables user context or built-in memory, verify the pinned importer omits that document before using it on real data. If a synthetic check shows that the importer still selects disabled documents, stop or use an owner-reviewed snapshot that never reads or includes those documents.

## 2. Apply privately; qualify the harness before chat

Review the report locally, account for every omission, and get authorization to apply if it is not already in scope. Rerun with `--apply`; add `--allow-partial` only after accepting the listed untranslated settings. Keep private configuration and reports outside public source. Do not use `--include-secrets` for routine onboarding. Remember that imported identity, memory text and skill bodies may enter the new Home's local Git history. Do not add a Git remote as part of onboarding.

Run `soulsteads verify <home>` and `soulsteads run <home> --dry-run`. A `needs-review` result is not a failure exit; inspect the JSON. Neither check authenticates a provider, loads the Home in a real session, or proves it is safe to activate. Use the [connection skill](../../soulsteads-connect/SKILL.md) to distinguish a harness working directory from a managed Home launch.

Start with an isolated workspace, state directory, and native configuration. Before using imported private context, make a disposable Home with synthetic inputs and exercise the selected command through Messaging's local CLI. Ask it to produce a small workspace artifact. Verify the file on disk, not just the path in the reply: tool paths are relative to the effective workspace, not necessarily the Home root. A second CLI process should resume the exact saved native session ID and recall something sent only in the first turn. Keep the route and state paths stable between processes. This checks the harness handoff, not Mattermost delivery.

Then qualify the imported Home separately. Check that the harness loads the intended instructions and a reviewed skill, uses the intended model/provider and not a fallback, and cannot perform a prohibited write. Provide separate credentials via the harness's supported mechanism. Recreate only explicitly approved MCP/tool grants; discovery does not prove correct authorization or useful output. Do not let chat enable unreviewed skill scripts, inherited home-wide credentials, memory automation, or scheduled work. Track these separately from portable definition import.

## 3. Prepare and prove one new Mattermost lane

Use the [bot and channel preparation section](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.4.0/docs/MATTERMOST.md#prepare-the-bot-and-channel) for bot creation and IDs, and the [manual service guide](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.4.0/docs/MANUAL-SERVICE.md) for installation and the Mattermost-only build.

**v0.4.0 documentation erratum:** Ignore the Mattermost page’s `credentials.env` instruction. The released service loads `$ROOT/work/.env`, as documented in the tagged manual service guide.

Use a dedicated bot and private test channel with nonempty `allowedUsers` and `allowedChannels` ID lists, thread isolation on, and `respondToAllMessages` off. Do not borrow an incumbent bot or request a token in chat. Mattermost does not support interactive approvals: keep write tools disabled or separately enforced by the harness and its operating environment.

### Before starting the test connector

- Place the private `.env` at `$ROOT/work/.env` (the service working directory), not beside `bridge.json` or in `credentials.env`. Use `{env:NAME}` references in JSON and keep harness credentials separate.
- Use an absolute path to the harness executable; confirm its version and permissions under the service account. The service `PATH` is not the shell `PATH`.
- Run `--check-config`. It can exit 0 with a missing `.env`; success does not prove credentials, membership, WebSocket delivery, or model use.
- Preview `service install --user --dry-run`. It renders the unit without installing or starting it. The released installer uses a fixed service name even if the directories differ. Do not replace an incumbent unit or reuse its bot, config, or session store.

From a permitted account, send a harmless synthetic marker prompt and check for an actual reply in its source thread. Follow up in that thread. After restarting **only** the idle test connector, use addressed `/status` and `/resume`, then a plain threaded follow-up; check the exact saved native session ID and recall of the marker. Check a rejected sender and channel with authorized test identities and verify they start zero native turns. A missing reply by itself is not proof of denial. Never troubleshoot continuity with `/clear` or `/reset`.

## Report and roll back

Record separately: direct source inspection, any detached snapshot and exclusions, offline Home verification, actual native checks, live connector delivery and restart, and negative authorization tests. Start the test lane with fresh sessions. Old Hermes conversations are not native sessions in the target harness, and cron jobs and external memory do not transfer automatically. Mark each unsupported feature as manual, intentionally left with Hermes, or blocked. To roll back a parallel test, stop only its connector and retain its state; do not reset the incumbent route or destroy transcripts.
