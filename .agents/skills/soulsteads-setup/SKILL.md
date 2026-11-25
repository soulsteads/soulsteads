---
name: soulsteads-setup
description: Plan and verify setup for one Soulsteads release.
---

# Soulsteads setup

Use this skill to plan, prepare, and verify **one** public Soulsteads tool at a time. The products are independent. Do not infer a combined installer, shared service, credential store, or automatic configuration between them.

## Start with one tool

If the operator has not picked a tool, suggest Workboard for a local SQLite sandbox, Home for portable agent configuration, Messaging for chat, Forge for workflows, Router for existing inference servers, or Skillstore to manage skills. In the Soulsteads catalog checkout, `node scripts/setup.mjs` lists choices; `node scripts/setup.mjs agent-workboard` prints one plan. Neither command installs anything.

## Before acting

1. Ask which product, target host/account, checkout location, and action scope are authorized. Treat a request to plan or prepare as permission only for that phase.
2. Read this `SKILL.md` from the checkout or from the runtime's documented skill location. Copying it there is optional and does not automatically register it with every runtime.
3. Read the selected release notes and the matching tagged guide before selecting commands. For packaged installs, check the platform and verify the selected artifact against that release's `SHA256SUMS` before installing; do not run a download directly. For source installs, use the verified checkout below. Keep credentials in a private file or the product's documented secret mechanism; never put a real secret in chat, tracked configuration, a URL, or command arguments.
4. Do not start/restart a service, install a user service, send a message, create a chat bot, create a database, create an API key, migrate a client, or change a provider until the human explicitly authorizes that exact effect.

## Public source records

These are reviewed public source pins for this skill, not claims that the pinned revisions are the newest available. Fetch the exact reviewed ref directly into a fresh temporary repository, then verify its resolved commit against the listed SHA before following the guide. A mismatch, missing guide, or rewritten history is a stop-and-report condition; do not clone a moving branch and check it only afterward, silently substitute newer source, reset an existing checkout, or use a private snapshot.

<!-- setup-pins -->
| Product | Public repository / release tag | Reviewed commit | Read first |
| --- | --- | --- | --- |
| Agent Home | `https://github.com/soulsteads/soulsteads-agent-home.git` / `v0.3.0` | `2873e7d7b5d863a3463c452d8103331d3d1dedd7` | [Setup guide](https://github.com/soulsteads/soulsteads-agent-home/blob/v0.3.0/README.md#get-started) |
| Agent Messaging | `https://github.com/soulsteads/soulsteads-agent-messaging.git` / `v0.4.0` | `32660af4a43b8b9bbf261a24e8584c9616bc51c3` | [Setup guide](https://github.com/soulsteads/soulsteads-agent-messaging/blob/v0.4.0/docs/SETUP.md#before-you-start) |
| Agent Workboard | `https://github.com/soulsteads/soulsteads-agent-workboard.git` / `v0.3.0` | `ae7bd0f343a7ae64bdc3c553d6aefe81de4a849f` | [Setup guide](https://github.com/soulsteads/soulsteads-agent-workboard/blob/v0.3.0/README.md#quickstart) |
| Model Router | `https://github.com/soulsteads/soulsteads-model-router.git` / `v0.3.0` | `2fe51ad7bbb8be4e01e7db072896dead812366cb` | [Setup guide](https://github.com/soulsteads/soulsteads-model-router/blob/v0.3.0/docs/SETUP.md#prerequisites) |
| Agent Forge | `https://github.com/soulsteads/soulsteads-agent-forge.git` / `v0.2.0` | `04d78410d41ce9f239a6c17d39fc331e6702ab06` | [Setup guide](https://github.com/soulsteads/soulsteads-agent-forge/blob/v0.2.0/README.md#quick-start) |
| Agent Skillstore | `https://github.com/soulsteads/soulsteads-agent-skillstore.git` / `v0.2.0` | `9dbe5d3eb2bb9337a4a07ddde456fe3311c433c7` | [Setup guide](https://github.com/soulsteads/soulsteads-agent-skillstore/blob/v0.2.0/README.md#quickstart) |
<!-- end-setup-pins -->

Do not treat an empty public repository or an unpublished name as installable source.

### Fetch one reviewed source revision

Use the exact reviewed tag or full commit SHA as `REVIEWED_REF`; do not substitute `main`, a moving branch, or a default branch. Set `REVIEWED_SHA` to the independently reviewed 40-character commit ID and `GUIDE` to the guide file path recorded for that revision (omit any `#anchor`). The recipe fetches only that ref, checks the resolved commit and guide before publishing the checkout, and refuses to reuse an existing destination. Final publication uses Linux `renameat2(RENAME_NOREPLACE)` through Python 3, with the stage and destination on the same filesystem. It fails closed if libc does not expose `renameat2`; do not replace it with plain `mv`.

```sh
# reviewed-checkout-recipe
set -eu
: "${REPOSITORY:?Set REPOSITORY to the public Git URL}"
: "${REVIEWED_REF:?Set REVIEWED_REF to the reviewed tag or full SHA}"
: "${REVIEWED_SHA:?Set REVIEWED_SHA to the expected full commit SHA}"
: "${GUIDE:?Set GUIDE to the documented guide path at that revision}"
: "${DESTINATION:?Set DESTINATION to a new checkout path}"

case "$REVIEWED_SHA" in
  ''|*[!0-9a-f]*) printf 'Refusing a non-full commit SHA: %s\n' "$REVIEWED_SHA" >&2; exit 1 ;;
esac
if [ "${#REVIEWED_SHA}" -ne 40 ]; then
  printf 'Refusing a non-full commit SHA: %s\n' "$REVIEWED_SHA" >&2
  exit 1
fi
if [ -e "$DESTINATION" ] || [ -L "$DESTINATION" ]; then
  printf 'Refusing existing destination: %s\n' "$DESTINATION" >&2
  exit 1
fi

mkdir -p "$(dirname "$DESTINATION")"
stage="$(mktemp -d "${DESTINATION}.tmp.XXXXXX")"
cleanup() {
  if [ -n "$stage" ] && [ -d "$stage" ]; then rm -rf -- "$stage"; fi
}
trap cleanup EXIT HUP INT TERM
git -C "$stage" init --quiet
git -C "$stage" remote add origin "$REPOSITORY"
git -C "$stage" fetch --no-tags --depth=1 origin "$REVIEWED_REF"
resolved="$(git -C "$stage" rev-parse --verify 'FETCH_HEAD^{commit}')"
if [ "$resolved" != "$REVIEWED_SHA" ]; then
  printf 'Refusing unexpected commit: wanted %s, fetched %s\n' "$REVIEWED_SHA" "$resolved" >&2
  exit 1
fi
git -C "$stage" checkout --detach "$resolved"
# Accept only an exact regular file from the pinned tree and checkout.
python3 - "$stage" "$resolved" "$GUIDE" <<'PY'
import os, stat, subprocess, sys

stage, revision, guide = sys.argv[1:]
parts = guide.split("/")

def refuse():
    print("Refusing guide: expected a regular committed file inside reviewed checkout", file=sys.stderr)
    sys.exit(1)

if guide.startswith("/") or any(part in ("", ".", "..") for part in parts):
    refuse()

pathspec = f":(top,literal){guide}"
tree = subprocess.run(
    ["git", "-C", stage, "ls-tree", "-z", "--full-tree", revision, "--", pathspec],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    check=False,
)
if tree.returncode != 0:
    refuse()
records = tree.stdout.split(b"\0")
if len(records) != 2 or not records[0]:
    refuse()
try:
    metadata, tree_path = records[0].split(b"\t", 1)
    mode, kind, _object_id = metadata.split(b" ", 2)
except ValueError:
    refuse()
if tree_path != os.fsencode(guide) or mode not in (b"100644", b"100755") or kind != b"blob":
    refuse()

if not hasattr(os, "O_DIRECTORY") or not hasattr(os, "O_NOFOLLOW"):
    refuse()
directory_flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
fd = None
try:
    fd = os.open(stage, directory_flags)
    for component in parts[:-1]:
        child_fd = os.open(component, directory_flags, dir_fd=fd)
        os.close(fd)
        fd = child_fd
    guide_info = os.stat(parts[-1], dir_fd=fd, follow_symlinks=False)
except OSError:
    refuse()
finally:
    if fd is not None:
        os.close(fd)
if not stat.S_ISREG(guide_info.st_mode):
    refuse()
PY
if [ -e "$DESTINATION" ] || [ -L "$DESTINATION" ]; then
  printf 'Refusing existing destination: %s\n' "$DESTINATION" >&2
  exit 1
fi
python3 -c 'import ctypes, errno, os, sys
libc = ctypes.CDLL(None, use_errno=True)
try:
    renameat2 = libc.renameat2
except AttributeError:
    print("Refusing publication: libc does not expose renameat2", file=sys.stderr)
    sys.exit(1)
renameat2.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint]
renameat2.restype = ctypes.c_int
if renameat2(-100, os.fsencode(sys.argv[1]), -100, os.fsencode(sys.argv[2]), 1) != 0:
    error = ctypes.get_errno()
    if error == errno.EEXIST:
        print(f"Refusing existing destination: {sys.argv[2]}", file=sys.stderr)
    else:
        print(f"Refusing publication: atomic no-replace rename failed: {os.strerror(error)}", file=sys.stderr)
    sys.exit(1)
' "$stage" "$DESTINATION"
stage=''
printf 'Reviewed guide: %s/%s\n' "$DESTINATION" "$GUIDE"
```

## Phase 1 — plan

Produce a bounded plan before making changes:

- Name one selected product and its exact source record above.
- List its documented prerequisites and the human-owned inputs that are still missing.
- Identify every proposed effect separately: source checkout, build/install, private configuration, database/state creation, service installation/start, remote connection, client migration, or live request.
- State the verification that follows each effect and the rollback/stop boundary.
- For a multi-product request, make separate plans and require a separate approval for every connection. Independence is the default.

A plan is complete when the user can approve or decline each effect without disclosing a secret.

## Phase 2 — prepare

After the approved scope is clear, follow only the selected release's installation instructions and matching guide. Prefer documented release packages where appropriate; source-build requirements are not runtime requirements.

### Agent Home

- Prerequisites: Python 3.11+, Git, and one separately installed and authenticated supported harness if launching it.
- Use the verified release wheel or run `uv tool install .` from the verified source checkout. Then follow the tagged quickstart to create a disposable Home with `soulsteads create <name> --runtime <opencode|pi|claude|codex> --path <new-home>`.
- A Home owns portable identity, instructions, skills, memory documents, generated native files, and its private local Git history. It does not install/authenticate a harness, run models, configure chat, or sandbox the harness.
- Use `soulsteads config <home> --sync` only for an explicitly chosen Home after reviewing changed canonical files. Starting a new native session is separate scope.
- For an existing Hermes profile, use the [Hermes-to-Mattermost onboarding checklist](references/hermes-to-mattermost.md) instead of creating a blank Home. Its import checkpoints also apply if you are not connecting chat.

### Agent Messaging

- Prerequisites: an already installed/authenticated supported coding agent, Rust/Cargo and Git; the guided Telegram path additionally needs Linux, Python 3.11+, a systemd user session, a dedicated bot, an allowed numeric user ID, and a private token file outside the checkout.
- Build only the documented feature set for the selected connector. Read `docs/SETUP.md` for its exact build command and manual configuration. Put connector secrets in the documented environment file and reference them as `{env:NAME}` in configuration.
- Set an explicit admission policy. Enabled remote connectors require a nonempty `allowedUsers` list unless the human deliberately chooses the documented `allowAllUsers` opt-in.
- `scripts/setup_gateway.py prepare` prepares a new Telegram installation but does not prove token, agent login, or chat connectivity. `install-service --start` installs/enables/starts a systemd user service and is a separately approved effect.

### Agent Workboard

- The SQLite library is bundled; no external database server is needed. A source build needs stable Rust and a C compiler. Decide whether agents are local (one host-owned database) or remote (HTTP); never share the SQLite database over a network filesystem.
- Use the Linux x86-64 archive or build/install with the documented locked Cargo command. Choose an existing private state directory and an absolute `WORKBOARD_DB` path before any board creation.
- A fresh board, agent registration, project/issue creation, and API-key issuance all mutate durable state. Do them only when named in scope. A returned API key is shown once: preserve it privately and do not print or paste it.
- The dashboard/API service defaults to loopback. Any access beyond localhost needs the operator's HTTPS/reverse-proxy design; do not expose it directly.

### Agent Forge

- This early release targets Linux and needs an empty dedicated PostgreSQL database for DBOS. Source builds need Rust 1.97+ and a C compiler. The Forge-home SQLite admission/effect store is not a replacement database.
- From the verified checkout, follow its locked Cargo install/init instructions. Set `FORGE_HOME` to the explicitly chosen private location and set `FORGE_DATABASE_URL` privately; do not inspect or print the operator token in the generated config.
- `soulsteads-forge serve` starts the loopback service. Registering workflows, running work, or scheduling recurring work creates durable/external effects and each needs explicit scope. A schedule is not verified until a due occurrence and its linked run are inspected.
- Optional models, harnesses, and executable plugins are separate trust decisions. Do not enable them merely because the core service starts.

### Model Router

- Prerequisites: Linux/Unix, Rust/Cargo, a C toolchain, Python 3 for the documented examples, and a running local OpenAI-compatible backend with known exact model ID, tested context limit, and tested concurrency. It does not host models.
- Read the configuration example and use the guide's private key/policy preparation procedure. Tailnet mode requires the host's assigned Tailnet IPv4; loopback is an explicit same-host mode. LAN/wildcard binds are rejected and port `4001` is reserved.
- Declare only capabilities tested on the exact backend. Keep the initial route text-only until tools, structured output, or images have been separately verified. Do not point the router at itself or a public-provider gateway.
- `soulsteads-router --check-config <policy>` validates policy structure and key files but does not prove inference. Foreground listening, a service unit, and any client migration are separate effects. HTTP has no built-in TLS; do not expose it directly to the internet.

### Agent Skillstore

- Use Python 3.11+ and the release wheel or the tagged source install. Linux is tested; macOS qualification is pending.
- Use the quickstart in a disposable directory to review, install, and recover a sample skill without a harness or model account. Its local actor labels are not authentication. Do not target a real harness or shared registry without separate approval.
- For skills-only backups, follow tracking-only mode in `docs/usage.md`; no registry is required. Do not treat a backup as permission to overwrite active skills.

Preparation is complete only when requested files/state are created in authorized locations, secrets remain private, and no unapproved service or external request was made.

## Phase 3 — verify

Run only the verification within the approved scope and report observed output rather than an inferred success.

| Product | Structural check | Live check, only when explicitly authorized |
| --- | --- | --- |
| Agent Home | `soulsteads verify <home>` and `soulsteads run <home> --dry-run` | Start the separately authenticated harness; verify the intended native session loaded the selected Home. |
| Agent Messaging | `soulsteads-messaging --check-config` | Start the approved connector and send `/status` plus a harmless allowed-user prompt; verify reply and follow-up. A running service alone is insufficient. |
| Agent Workboard | `soulsteads-workboard schema` plus a read such as `project_list` | Verify the configured worker's intended CLI/MCP/HTTP access and inspect state; do not equate a dashboard view with external work completion. |
| Agent Forge | Validate the intended workflow and inspect its stored definition/state | Inspect a terminal run's actual output; for a schedule, inspect a real due occurrence and linked terminal run. |
| Model Router | `soulsteads-router --check-config <policy>` | Authenticate, verify the catalog contains the authorized alias, then verify a real completion and reject an invalid/missing bearer. |
| Agent Skillstore | Use `soulsteads-skillstore status` against the disposable quickstart target and verify the sample's version and clean receipt. | For an approved shared registry, verify the selected client's documented access without publishing or executing a skill. |

Report the checked source pin, commands/actions actually performed, observed checks, any intentionally untested live behavior, state locations, and required next approval. Do not claim service, provider, chat, harness, or external-work success from a build, configuration check, process start, or admission response alone.

## Safety limits

- Never copy credentials between products, add them to tracked files, or request them in conversation.
- Never replace an existing proxy, service, workspace, database, bot webhook, or client configuration without specific approval and a recovery plan.
- Do not claim product compatibility from shared naming. Use only an interface documented by both sides and follow `soulsteads-connect` for an optional connection.
- Each product remains useful independently; stopping or removing one must not be presented as an automatic migration or cleanup of another.
