# OpenAPI — Review checklist

Step-by-step procedure for reviewing a PR that touches the OpenAPI spec or the
Spectral configuration. Read [spec-conventions.md](spec-conventions.md) and
[spectral-ruleset.md](spectral-ruleset.md) first — every step below checks
against them.

## Procedure

1. **Spec validity.** Confirm the spec parses as valid YAML and declares
   OpenAPI 3.1 or later (e.g. `openapi: "3.1.0"`, `"3.2.0"`). If a structural
   parse error exists, stop — nothing else can be meaningfully reviewed.

2. **File location and naming.** The spec is `openapi.yaml` at the repo root.
   The Spectral config is `spectral.config.yaml` at the repo root. Flag any
   deviation in name or location.

3. **Info block.** Check all required fields per `spec-conventions.md`: `title`,
   `description`, `version` (matching the package version), `contact` (with
   `name` and `url` or `email`), `license` (with `name` and either `url` or
   SPDX `identifier`).

4. **Servers.** At least one entry with a real host — no `example.com`.

5. **Paths and parameters.** Kebab-case segments, no trailing slashes, every
   `{param}` has a matching `parameters` entry with a `description`.

6. **Operations.** Every operation has: unique URL-safe `operationId`,
   `summary`, `description` (unless summary is fully self-explanatory), at
   least one tag, and appropriate response codes (2xx required; 4xx and 3xx
   as applicable).

7. **Schemas.** All in `components/schemas` and referenced via `$ref`. No
   `$ref` siblings, no duplicated enum entries, `items` on every array,
   examples that validate, no unused components.

8. **Security.** At least one `securitySchemes` defined, `security` applied
   at spec or operation level, every operation covered.

9. **Tags.** Every tag has a `description`, tags sorted alphabetically.

10. **Streaming / SSE.** If the spec includes `text/event-stream` responses:
    event schemas defined in `components/schemas`, `itemSchema` used on 3.2+,
    termination signal documented, error-event strategy described.

11. **Documentation hygiene.** No `eval()` or `<script>` in descriptions.

12. **Spectral config.** Extends all six rulesets (three built-in, three
    community — see `spectral-ruleset.md`). Every deactivated rule has a
    comment explaining why. No rule is silenced without a recorded rationale.

13. **Local lint.** Run `npx @stoplight/spectral-cli lint openapi.yaml` — zero
    error-severity findings.

## Reporting

Report the result as a checklist: each convention as pass/deviation, with the
exact line and the fix for every deviation. Order deviations by severity —
spec-validity and security issues first, naming and ordering last.
