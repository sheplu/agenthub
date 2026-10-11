# Brag — Storage

File locations, JSON schemas, bootstrap procedure, and idempotency rules for
the brag skill's persistent state. Read this on first run or whenever
reading/writing `~/.brag/` files.

## Directory

All persistent state lives under `~/.brag/`. Create with `mkdir -p` on first
run. Three files:

| File | Purpose | Visibility |
| --- | --- | --- |
| `profile.json` | User identity and preferences | User-facing — editable |
| `.state.json` | Runtime state (last run, dedup hashes) | Hidden dotfile — managed by the skill |
| `brag.md` | The growing accomplishment document | User-facing — the primary output |

## `profile.json` schema

```json
{
  "name": "string — user's display name (required)",
  "level": "junior | mid | senior | staff | principal (required)",
  "team": "string — team or org name (optional, null if skipped)",
  "email": "string — git author email for matching commits (optional, inferred from git config if absent)",
  "github_username": "string — GitHub handle for PR/issue queries (optional, inferred from gh api user if absent)",
  "preferences": {
    "default_window_days": "number — default time window when no last_run exists (default: 7)",
    "categories": "string[] | null — custom category overrides (null = use defaults from output-format.md)"
  }
}
```

- Created on first run by prompting the user. `name` and `level` are required;
  everything else is optional and can be inferred.
- Read on every run. Never modified silently — changes require explicit user
  request.

## `.state.json` schema

```json
{
  "last_run": "string — ISO 8601 timestamp of the last successful run (null on first run)",
  "entry_hashes": "string[] — SHA-256 hashes of all written entries for dedup"
}
```

- Read at the start of every run. Written at the end of a successful run.
- If the file is missing or corrupt, treat it as a first run: default window,
  empty hashes.

## `brag.md`

The growing output document. Format defined in
[output-format.md](output-format.md). If absent, create with the header block.
If present, prepend the new period section after the header block (before the
first existing period).

## Bootstrap procedure (first run)

1. Check for `~/.brag/profile.json`. If it exists, read it and proceed to data
   gathering.
2. If absent, prompt the user interactively:
   - "What name should I use in your brag document?"
   - "What is your current engineering level?" — offer: `junior`, `mid`,
     `senior`, `staff`, `principal`.
   - "What team or org are you on? (optional, press enter to skip)"
3. Infer `email` from `git config user.email`. If the command fails, leave
   `null` and note the gap.
4. Infer `github_username` from `gh api user -q .login`. If the command fails,
   leave `null` and note the gap.
5. Write `profile.json` with the collected and inferred values. Set
   `preferences.default_window_days` to `7` and `preferences.categories` to
   `null`.
6. Create `.state.json` with:
   ```json
   {
     "last_run": null,
     "entry_hashes": []
   }
   ```
7. Log what was created: "Created `~/.brag/profile.json` and
   `~/.brag/.state.json`. Ready to generate your first brag document."

## Idempotency contract

- A run is idempotent because of content-hash dedup. Running twice with the
  same time window writes no new entries — all hashes already exist in
  `.state.json`.
- A run that crashes before writing `.state.json` will re-process the same
  window on next run. This is safe: dedup happens against the hash list, so
  entries already written to `brag.md` are not duplicated.
- If `brag.md` is manually edited (entries deleted by the user), the
  corresponding hashes remain in `.state.json`. A re-run will **not** re-add
  deleted entries. To force re-addition, the user must clear the relevant
  hashes from `.state.json` or delete the file entirely.

## Edge cases

| Condition | Behavior |
| --- | --- |
| `~/.brag/` does not exist | Create it with `mkdir -p`. Run bootstrap. |
| `profile.json` exists but `.state.json` is missing | Treat as first data run — default window, empty hashes. |
| `profile.json` is corrupt or unparseable JSON | Bail with error: "Your profile at `~/.brag/profile.json` is corrupt. Please fix or delete it and re-run." |
| `.state.json` is corrupt | Treat as first run — log warning, proceed with defaults. |
| `brag.md` exists but has no header block | Prepend a fresh header block derived from `profile.json`, then add the period section. |
