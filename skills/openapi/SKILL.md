---
name: openapi
description: Author or review OpenAPI specifications (3.1+) with Spectral linting — use when writing or updating an API spec, configuring Spectral rules, or reviewing a PR that touches the spec.
---

# OpenAPI

A skill for authoring and reviewing OpenAPI specifications (3.1 and later) and
their Spectral linting configuration. It encodes the house conventions for spec
structure, naming, security, and the linter ruleset — everything needed to
keep an API surface documented and design-reviewed.

The spec must pass Spectral linting with zero error-severity findings before
merge. Run `npx @stoplight/spectral-cli lint openapi.yaml` locally to verify.

## Core rules at a glance

### Spec

- **Default layout**: a single `openapi.yaml` at the repository root, OpenAPI
  3.1 or later, `info.version` tracks the package version. Large projects may split the
  spec into multiple files using `$ref` to external documents — the root file
  remains the entry point.
- **Paths**: kebab-case segments, no trailing slashes, every parameter
  described.
- **Operations**: every operation has a unique URL-safe `operationId`,
  `summary`, `description`, at least one tag, and response codes for 2xx, 3xx,
  and 4xx.
- **Schemas**: all schemas in `components/schemas`, referenced via `$ref`
  everywhere — no inline object schemas in paths, no `$ref` siblings, no
  duplicated enum entries, `items` on every array, examples that validate.
- **Security**: `securitySchemes` defined, `security` applied at operation or
  spec level.
- **Streaming / SSE**: endpoints using `text/event-stream` define per-event
  schemas (via `itemSchema` on 3.2+), document termination signals, and
  describe reconnection behavior.
- **Tags**: every tag has a description, tags sorted alphabetically.

### Linting

- **Config**: `spectral.config.yaml` at the repository root.
- **Six rulesets**: built-in (`spectral:oas`, `spectral:oas3-api`,
  `spectral:api`) plus community (`@ibm-cloud/openapi-ruleset`,
  `@stoplight/spectral-owasp-ruleset`, `@apisyouwonthate/style-guide`).
- **All rules active by default** — the config only lists rules that are
  explicitly turned off with rationale. See `spectral-ruleset.md`.

The exact rules, rationale, and examples live in the reference files below —
never guess details from this summary.

## References

Read these on demand — do not guess details from the summary above:

| File | Read when |
| --- | --- |
| [references/spec-conventions.md](references/spec-conventions.md) | Always, before writing or reviewing any spec — file location, versioning, info block, path/operation/schema/security/tag conventions. |
| [references/spectral-ruleset.md](references/spectral-ruleset.md) | Configuring or reviewing the Spectral linter — base rulesets, the full rule catalog by category, how to run locally, adding custom rules. |
| [references/review-checklist.md](references/review-checklist.md) | Reviewing a PR that touches the spec or linting config — the step-by-step audit procedure and deviation-report format. |

