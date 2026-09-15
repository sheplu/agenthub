# OpenAPI — Spectral ruleset

The Spectral linting configuration and the rule management approach.
Read this file before writing or reviewing the `spectral.config.yaml` file or
when configuring the linter for a new repository.

## Config file

- **Location**: `spectral.config.yaml` at the repository root.
- **Format**: YAML, not JSON or `.spectral.yaml` (the legacy name).

## Rulesets

The config extends six rulesets. All rules from every ruleset are **active by
default** — the config only lists rules that are explicitly turned off.

```yaml
extends:
  # Built-in
  - spectral:oas
  - spectral:oas3-api
  - spectral:api
  # Community
  - "@ibm-cloud/openapi-ruleset"
  - "@stoplight/spectral-owasp-ruleset"
  - "@apisyouwonthate/style-guide"
```

### Built-in rulesets

| Ruleset | Purpose |
| --- | --- |
| `spectral:oas` | OAS 3.x recommended bundle — schema validation, structural checks. |
| `spectral:oas3-api` | OAS 3.x API design rules — operation conventions, response patterns. |
| `spectral:api` | General API design rules — not OAS-specific, covers naming and consistency. |

### Community rulesets

These must be installed as dev dependencies before linting:

```bash
npm install --save-dev @ibm-cloud/openapi-ruleset @stoplight/spectral-owasp-ruleset @apisyouwonthate/style-guide
```

| Ruleset | Purpose |
| --- | --- |
| `@ibm-cloud/openapi-ruleset` | IBM Cloud API design rules — usability (summary style, pagination patterns), robustness (no array responses, consistent error format), and API evolution (backward compatibility). |
| `@stoplight/spectral-owasp-ruleset` | OWASP API Security Top 10 (2023 edition) — enforces HTTPS on servers, rate-limiting headers on responses, security scheme coverage, and flags common security anti-patterns. Use `@^2.0` for the 2023 edition. |
| `@apisyouwonthate/style-guide` | API design best practices — health endpoints, self-descriptive APIs, standardized error formats (RFC 7807 / JSON:API), versioning strategy, and naming consistency. |

## Rule management approach

**Activate everything, deactivate with rationale.** Every rule from every
extended ruleset is active unless explicitly turned off in the `rules:` section
with a comment explaining why. This keeps the config short, auditable, and
biased toward strictness — silencing a rule requires a conscious decision.

When deactivating a rule:

1. Set it to `off` in the `rules:` section.
2. Add a comment on the same line or the line above explaining the reason.
3. Group deactivations by ruleset for readability.

## Common deactivations

Some rules conflict with OpenAPI 3.1+ features or common design choices. These
are expected deactivations — not every project will need all of them, but they
are the most frequent ones to encounter.

### Core OAS

| Rule | Reason |
| --- | --- |
| `license-url` | OpenAPI 3.1 uses SPDX `identifier` instead of `url`; rule predates 3.1. |

### IBM Cloud

| Rule | Reason |
| --- | --- |
| `ibm-operationid-casing-convention` | Project uses camelCase operationIds (IBM expects snake_case). |
| `ibm-operationid-naming-convention` | Not all endpoints follow IBM's `verb_resource_noun` pattern. |
| `ibm-path-segment-casing-convention` | Uses kebab-case per spec conventions; IBM expects snake_case. |
| `ibm-schema-type-format` | OAS 3.1 features like `type: "null"` and `format: uri` are valid. |
| `ibm-no-nullable-properties` | OAS 3.1 nullable pattern (`oneOf` with `type: "null"`) is intentional. |
| `ibm-avoid-inline-schemas` | OAS 3.1 nullable pattern requires inline schemas in some cases. |
| `ibm-error-content-type-is-json` | Projects using RFC 9457 (`application/problem+json`) for errors. |
| `ibm-error-response-schemas` | Same RFC 9457 reason. |
| `ibm-major-version-in-path` | Not all APIs use `/vN` path prefix. |

### APIs You Won't Hate

| Rule | Reason |
| --- | --- |
| `api-home` | Not every project serves an API home resource at `/`. |

These tables are a starting point. Review each deactivation against your
project's actual design decisions — do not disable rules blindly.

## Config template

```yaml
extends:
  # Built-in
  - spectral:oas
  - spectral:oas3-api
  - spectral:api
  # Community
  - "@ibm-cloud/openapi-ruleset"
  - "@stoplight/spectral-owasp-ruleset"
  - "@apisyouwonthate/style-guide"

rules:
  # --- Core OAS overrides ---
  license-url: off # OAS 3.1 uses SPDX identifier, not url

  # --- IBM Cloud overrides ---
  ibm-operationid-casing-convention: off # camelCase operationIds
  ibm-operationid-naming-convention: off # not all endpoints follow verb_resource_noun
  ibm-path-segment-casing-convention: off # kebab-case, not snake_case
  ibm-schema-type-format: off # OAS 3.1 type/format features
  ibm-no-nullable-properties: off # nullable-by-design fields
  ibm-avoid-inline-schemas: off # OAS 3.1 nullable oneOf pattern
  ibm-error-content-type-is-json: off # RFC 9457 problem+json
  ibm-error-response-schemas: off # RFC 9457 problem+json
  ibm-major-version-in-path: off # not all APIs use /vN prefix

  # --- APIs You Won't Hate overrides ---
  api-home: off # no API home resource at /

  # --- Project-specific overrides ---
  # Add project-specific deactivations here with rationale.
```

## Running locally

Install dependencies and run Spectral against the spec:

```bash
npm install --save-dev @stoplight/spectral-cli @ibm-cloud/openapi-ruleset @stoplight/spectral-owasp-ruleset @apisyouwonthate/style-guide
npx @stoplight/spectral-cli lint openapi.yaml
```

Fix all error-severity findings before opening a PR. Warnings are
informational and should be addressed when practical but do not block merge.

## Adding custom rules

When a project-specific convention is not covered by the extended rulesets:

1. Define the rule in the `rules:` section of `spectral.config.yaml` using
   Spectral's custom-rule syntax (JSONPath `given`, `then` with a function).
2. Set severity to `error` if the rule is merge-blocking, `warn` otherwise.
3. Add the rule to the review checklist
   ([review-checklist.md](review-checklist.md)) so reviewers know to check it.
4. Document the rule's purpose in a comment above its definition in the config
   file.
