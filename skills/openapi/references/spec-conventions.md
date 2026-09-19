# OpenAPI — Spec conventions

The authoritative rules for writing and maintaining the OpenAPI specification.
Read this file entirely before authoring or reviewing a spec.

## File and version

- **Location**: `openapi.yaml` at the repository root. This is the entry
  point for tooling (linters, code generators, documentation).
- **Format**: YAML, not JSON. The file extension is `.yaml`, not `.yml`.
- **OpenAPI version**: 3.1 or later (`openapi: "3.1.0"`, `"3.2.0"`, etc.).
- **Spec version**: `info.version` tracks the package version (e.g. the value
  in `package.json`). Update it in the same commit that bumps the package
  version.
- **Splitting**: for large projects, the spec may be split into multiple files
  using `$ref` to external YAML documents (e.g. `paths/users.yaml`,
  `components/schemas/User.yaml`). The root `openapi.yaml` remains the single
  entry point — every `$ref` chain resolves from it. Linting and validation
  always target the root file.

## Info block

The `info` object must include all of the following:

| Field | Requirement |
| --- | --- |
| `title` | Human-readable API name. |
| `description` | One-paragraph summary of the API's purpose and scope. |
| `version` | Tracks the package version (see above). |
| `contact` | At minimum `name` and `url` (or `email`). |
| `license` | `name` and either `url` or `identifier` (SPDX expression, preferred in 3.1+). |

## Servers

At least one `servers` entry. Use a real or realistic base URL — never
`example.com` or a placeholder host. All server URLs should use HTTPS (the
OWASP ruleset enforces this). For local development, use environment-specific
configuration rather than listing `http://localhost` in the committed spec.
Every server entry must also declare `x-internal: true` or `false` and a
`description` naming its environment (e.g. production, staging) — the
`owasp:api9:2023-inventory-access` and
`owasp:api9:2023-inventory-environment` rules block merges without them.

## Path conventions

- **Kebab-case segments**: `/user-profiles/{userId}`, not `/userProfiles` or
  `/user_profiles`.
- **No trailing slashes**: `/users`, not `/users/`.
- **Parameters match**: every `{param}` in the path has a corresponding entry
  in `parameters` — the `path-params` rule enforces this.
- **Parameter descriptions**: every path and query parameter has a
  `description` explaining its purpose and valid values.

## Operation conventions

Every operation (each HTTP method on a path) must have:

| Field | Rule |
| --- | --- |
| `operationId` | Unique across the entire spec, URL-safe (letters, digits, hyphens, underscores). Convention: `verbNoun` camelCase (e.g. `listUsers`, `getUserById`, `createProject`). |
| `summary` | One-line human-readable summary (≤80 characters — the `ibm-operation-summary-length` rule blocks longer summaries at error severity). |
| `description` | Fuller description of behavior, side effects, and non-obvious semantics. May be omitted only when the summary is fully self-explanatory. |
| `tags` | At least one tag. Tags group operations in generated documentation. |
| `responses` | At minimum a 2xx success response. Should also include 4xx client-error responses for expected failure modes (400, 401, 403, 404, 422 as applicable). Include 3xx only when the endpoint actually redirects. |

### Response objects

- Every response has a `description`.
- Every 2xx and 4xx response defines rate-limit headers (e.g.
  `RateLimit-Limit`; use standardized names, never `X-` prefixes), and every
  response defines `Access-Control-Allow-Origin` — the
  `owasp:api4:2023-rate-limit`, `owasp:api4:2023-rate-limit-retry-after`
  (429 responses need `Retry-After`), and
  `owasp:api8:2023-define-cors-origin` rules block merges without them.
- Success responses (2xx) include a `content` block with the response media
  type and schema, unless the response is `204 No Content`.
- Error responses (4xx, 5xx) use a shared error schema via `$ref` to
  `components/schemas/Error` (or a similarly named shared component).

## Schema conventions

- **All schemas in `components/schemas`**: define every reusable data shape
  under `components/schemas` and reference it via `$ref` in paths. Prefer
  extracting inline object schemas — the exception is OAS 3.1+ nullable
  patterns (`oneOf` with `type: "null"`) where inline is unavoidable.
- **No `$ref` siblings (house rule)**: a `$ref` keyword must be the only key
  in its object. Do not place `description`, `nullable`, or other keywords
  alongside `$ref` — use `allOf` wrapping when additional constraints are
  needed. Siblings are legal under OpenAPI 3.1 (JSON Schema 2020-12), and
  Spectral's `no-$ref-siblings` rule enforces this only on OAS 2.0/3.0
  documents — this house rule is kept for tooling compatibility and is
  review-enforced on 3.1+ specs.
- **No duplicated enum entries**: every `enum` array contains unique values.
- **Array `items`**: every `type: array` has an `items` keyword defining the
  element schema.
- **Valid examples**: every `example` or `examples` value validates against the
  schema it belongs to.
- **Unused components**: do not leave orphaned schemas in `components/` —
  every defined component is referenced somewhere. The `oas3-unused-component`
  rule enforces this.

## Security

- Define at least one security scheme in `components/securitySchemes` — the
  `no-security-schemes-defined` rule blocks merges when a `components` object
  exists without `securitySchemes`.
- Apply `security` at the spec level (default for all operations) or at the
  individual operation level. Write operations (POST, PUT, PATCH, DELETE)
  without security block the merge (`owasp:api2:2023-write-restricted`);
  unprotected read operations produce a warning
  (`owasp:api2:2023-read-restricted`) that reviewers must flag explicitly.
- For public endpoints that genuinely require no authentication, apply an
  empty security requirement (`security: [{}]`) explicitly rather than
  omitting the field.

## Tags

- Every tag used on an operation is declared in the top-level `tags` array.
- Every tag has a `description`.
- Tags are listed in **alphabetical order** — the
  `openapi-tags-alphabetical` rule enforces this.

## Streaming and Server-Sent Events (SSE)

Endpoints that stream data (e.g. LLM token streams, real-time feeds) must be
documented in the spec like any other operation. Use the `text/event-stream`
content type to signal SSE.

### Response content type

```yaml
responses:
  "200":
    description: Stream of completion tokens.
    content:
      text/event-stream:
        schema:
          type: string
```

### Per-event schema (OpenAPI 3.2+)

OpenAPI 3.2 introduces `itemSchema` for `text/event-stream` media types,
allowing the schema of each individual event in the stream to be defined
separately from the stream itself:

```yaml
responses:
  "200":
    description: Stream of completion events.
    content:
      text/event-stream:
        itemSchema:
          $ref: "#/components/schemas/CompletionEvent"
```

Use `itemSchema` when on OpenAPI 3.2+. On 3.1, document the event structure
in the `description` and define the event schema in `components/schemas` even
if it cannot be formally linked via `itemSchema`.

### Event design conventions

- **Define event schemas** in `components/schemas` — one schema per event
  type. For multiple event types, use `oneOf` or `discriminator`.
- **Document the sentinel**: if the stream uses a termination signal (e.g.
  `[DONE]`, `event: done`), describe it in the operation `description`.
- **Error events**: prefer failing fast with a non-2xx response before the
  stream starts. If errors can occur mid-stream, reserve a control event type
  (e.g. `event: error`) and include it in the event schema's `oneOf`.
- **Reconnection**: if the endpoint supports client reconnection via
  `Last-Event-ID`, document the `id` field semantics and any cursor/offset
  parameters in the operation description.

## Documentation hygiene

- No `eval()` calls in Markdown descriptions (`no-eval-in-markdown`).
- No `<script>` tags in Markdown descriptions (`no-script-tags-in-markdown`).
- Descriptions use standard Markdown; avoid raw HTML beyond basic formatting
  tags (`<b>`, `<em>`, `<code>`).
