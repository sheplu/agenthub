# OpenAPI — Spectral ruleset

The Spectral linting configuration and the rule management approach.
Read this file before writing or reviewing the `.spectral.yaml` file or
when configuring the linter for a new repository.

## Config file

- **Location**: `.spectral.yaml` at the repository root.
- **Format**: YAML, not JSON.
- **Auto-discovery**: `spectral lint` loads this filename automatically; no
  `--ruleset` flag is needed. Other supported names match the pattern
  `.?spectral.(js|ya?ml|json)` — anything else (e.g. `spectral.config.yaml`)
  is silently ignored.

## Rulesets

The config extends four rulesets, each in `all` mode so that **every rule is
active** — the config only lists rules that are explicitly turned off.
(Plain `extends` activates only each ruleset's recommended rules, which
leaves rules like `contact-properties`, `info-license`, `tag-description`,
`openapi-tags-alphabetical`, and `oas3-parameter-description` disabled.)

```yaml
extends:
  # Built-in
  - [spectral:oas, all]
  # Community
  - ["@ibm-cloud/openapi-ruleset", all]
  - ["@stoplight/spectral-owasp-ruleset", all]
  - ["@apisyouwonthate/style-guide", all]
```

### Built-in rulesets

| Ruleset | Purpose |
| --- | --- |
| `spectral:oas` | OAS 3.x rules — schema validation, structural checks, operation conventions. |

Spectral ships exactly three built-in rulesets: `spectral:oas`,
`spectral:asyncapi`, and `spectral:arazzo`. There is no `spectral:oas3-api`
or `spectral:api` — extending them fails with a module-resolution error, and
the other two do not apply to OpenAPI specs.

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

## Merge-blocking rules

Spectral's default gate fails only on **error-severity** findings. These are
the error-severity rules active in the merged config — an author must satisfy
all of them or explicitly deactivate them with rationale. Listed by source,
OAS 3.x-relevant rules only (2.0-only rules such as `hosts-https-only-oas2`
never fire on a 3.1+ spec).

### Core (`spectral:oas`)

| Rule | Requires |
| --- | --- |
| `oas3-schema` | Document validates against the OAS 3.x JSON Schema. |
| `operation-operationId-unique` | `operationId`s unique across the whole spec. |
| `path-params` | Every `{param}` in a path is declared, and every declared path parameter is used. |
| `openapi-tags-uniqueness` | Top-level tag names are unique. |
| `no-$ref-siblings` | No keywords next to `$ref` (enforced on OAS 2.0/3.0 documents only). |
| `oas3-server-variables` | Every server URL variable has a `variables` entry. |

### IBM Cloud

| Rule | Requires |
| --- | --- |
| `ibm-operation-summary-length` | Operation summaries are at most 80 characters. |
| `ibm-integer-attributes` | Integer schemas declare `format` (int32/int64), `minimum`, and `maximum`. |
| `ibm-no-array-responses` | No top-level array response bodies — wrap in an object. |
| `ibm-requestbody-is-object` | Request bodies are structured as objects. |
| `ibm-required-array-properties-in-response` | Array properties in response bodies are required. |
| `ibm-required-enum-properties-in-response` | Enum properties in response bodies are required. |
| `ibm-define-required-properties` | Every entry in `required` exists in the schema's `properties`. |
| `ibm-property-casing-convention` / `ibm-parameter-casing-convention` | snake_case properties and path/query parameters, kebab-separated Pascal case header parameters (path segments overridden to kebab-case in the template). |
| `ibm-schema-type-format` | Valid type/format combinations (`format: uri`, `type: [string, "null"]` patterns are deactivated in the template). |
| `ibm-etag-header` | GET operations returning mutable resources define an `ETag` response header. |
| `ibm-precondition-headers` | Operations declaring a `412` response support `If-Match` or `If-None-Match`. |
| `ibm-operation-responses` | Every operation has a `responses` object. |
| `ibm-parameter-schema-or-content` | Parameters define either `schema` or `content`. |
| `ibm-no-consecutive-path-parameter-segments` / `ibm-valid-path-segments` | Well-formed path strings. |
| `ibm-avoid-multiple-types` | Schema `type` is a single value, not an array (3.1 nullable patterns deactivated in the template). |
| `ibm-avoid-property-name-collision` / `ibm-unique-parameter-request-property-names` | No duplicate or shadowed property/parameter names. |
| `ibm-enum-casing-convention` | Enum values follow the configured casing (snake_case by default). |
| `ibm-discriminator-property` | Discriminator `propertyName` values exist in the schema. |
| `ibm-pattern-properties` / `ibm-unevaluated-properties` | Restrictions on `patternProperties` / `unevaluatedProperties`. |
| `ibm-schema-keywords` / `ibm-no-unsupported-keywords` | Only allowed schema keywords are used. |
| `ibm-accept-and-return-models` | Request and response bodies are defined model instances, not loose primitives. |
| `ibm-no-ref-in-example` | No `$ref` inside `example` values. |
| `ibm-securityscheme-attributes` | Security schemes carry the required attributes for their type. |
| `ibm-redirect-response-body` | Redirect (3xx) response bodies match status-code expectations. |
| `ibm-property-attributes` | Schema properties define the expected attributes. |

### OWASP API Security Top 10 (2023)

| Rule | Requires |
| --- | --- |
| `owasp:api1:2023-no-numeric-ids` | `id`-like parameters are not plain integer sequences (use UUID or random strings). |
| `owasp:api2:2023-no-http-basic` | No `scheme: basic` security schemes. |
| `owasp:api2:2023-no-api-keys-in-url` | `apiKey` schemes use `in: header` (or cookie), never path/query. |
| `owasp:api2:2023-no-credentials-in-url` | No path/query parameter names containing token/secret/password/api-key terms. |
| `owasp:api2:2023-auth-insecure-schemes` | HTTP auth schemes are not `negotiate` or `oauth` (v1). |
| `owasp:api2:2023-jwt-best-practices` | oauth2/JWT bearer schemes mention RFC 8725 in their `description`. |
| `owasp:api2:2023-short-lived-access-tokens` | Every oauth2 flow defines `refreshUrl`. |
| `owasp:api2:2023-write-restricted` | Every write operation (POST/PUT/PATCH/DELETE) is covered by a security requirement. |
| `owasp:api4:2023-rate-limit` | Every 2xx/4xx response defines rate-limit headers (`RateLimit-Limit`; `X-RateLimit-*` also matches but is blocked by `no-x-headers`). |
| `owasp:api4:2023-rate-limit-retry-after` | 429 responses define a `Retry-After` header. |
| `owasp:api4:2023-array-limit` | Array schemas specify `maxItems`. |
| `owasp:api4:2023-string-limit` | String schemas specify `maxLength`, `enum`, or `const`. |
| `owasp:api4:2023-integer-limit` | Integer schemas specify `minimum`/`maximum`. |
| `owasp:api4:2023-integer-format` | Integer schemas specify `format` (int32/int64). |
| `owasp:api5:2023-admin-security-unique` | `/admin` paths use different security schemes than the rest of the API. |
| `owasp:api8:2023-no-server-http` | Server URLs use `https` (or `wss`). |
| `owasp:api8:2023-define-cors-origin` | Every response defines an `Access-Control-Allow-Origin` header. |
| `owasp:api9:2023-inventory-access` | Every `servers` entry declares `x-internal: true` or `false`. |
| `owasp:api9:2023-inventory-environment` | Every server `description` names its environment (local, staging, production, etc.). |

### APIs You Won't Hate

| Rule | Requires |
| --- | --- |
| `no-security-schemes-defined` | `components.securitySchemes` exists when a `components` object exists. |
| `no-numeric-ids` / `no-http-basic` | Same intent as the OWASP equivalents. |
| `no-x-headers` / `no-x-response-headers` | No `X-` prefixed header names — use standardized names (`RateLimit-*`, not `X-RateLimit-*`). |
| `request-GET-no-body-oas3` | GET operations have no request body. |
| `hosts-https-only-oas3` | Server URLs use HTTPS. |
| `no-file-extensions-in-paths` | Paths do not end in file extensions. |

Many house conventions (operation descriptions, tags, kebab-case paths,
error-response coverage) are enforced only at `warn` severity by these
rulesets — the error gate does not block on them. They are covered by the
[review checklist](review-checklist.md) instead.

## Config template

```yaml
extends:
  # Built-in
  - [spectral:oas, all]
  # Community
  - ["@ibm-cloud/openapi-ruleset", all]
  - ["@stoplight/spectral-owasp-ruleset", all]
  - ["@apisyouwonthate/style-guide", all]

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

The default gate is error-only: `spectral lint` exits non-zero only on
error-severity findings — the merge-blocking rules listed above. Warnings do
not block merge; several house conventions (operation descriptions, tags,
kebab-case paths) are enforced only at `warn` severity and are covered by the
review checklist instead. To make a warn-severity convention blocking, either
promote the rule to `error` in the config or run the gate with
`--fail-severity=warn`.

## Adding custom rules

When a project-specific convention is not covered by the extended rulesets:

1. Define the rule in the `rules:` section of `.spectral.yaml` using
   Spectral's custom-rule syntax (JSONPath `given`, `then` with a function).
2. Set severity to `error` if the rule is merge-blocking, `warn` otherwise.
3. Add the rule to the review checklist
   ([review-checklist.md](review-checklist.md)) so reviewers know to check it.
4. Document the rule's purpose in a comment above its definition in the config
   file.
