# Quality Gates — Node.js setup

Runtime-specific conventions for Node.js repositories (the default runtime).
Read this only when the target repo is Node.js; the generic rules live in
[conventions.md](../conventions.md).

## Runtime & install

- **Node 26** (current LTS) via `actions/setup-node` with `node-version: 26`
  and `cache: npm`.
- Install with `npm ci --prefer-offline` — never `npm install` in CI.

## Toolchain

- **TypeScript 7** run natively (Node type-stripping) — no build step needed to
  execute `.ts` sources; `typecheck` is `tsc --noEmit`.
- **oxlint** for `lint`.
- **`node:test`** native runner for all test tiers — no test-framework
  dependency.
- **fast-check** for the fuzz tier's property-based tests.
- **typedoc** (or a jsdoc equivalent) for `docs`.

The intent: the smallest possible supply chain — dev dependencies should be
roughly `typescript`, `oxlint`, `typedoc`, `fast-check`, `@types/node` and
little else.

## Job-to-tool mapping

| Job | Node implementation |
| --- | --- |
| `osv-scan` | `osv-scanner --lockfile=package-lock.json` |
| `audit` | `npm audit` |
| `lint` | `npm run lint` → oxlint |
| `typecheck` | `npm run typecheck` → `tsc --noEmit` |
| `build` | `npm run build` + `npm pack` dry-run + tarball size check |
| `test-<tier>` | `npm run test:<tier>` (coverage variant) → `node --test` |
| `docs` | `npm run docs:build` → typedoc |

## Expected npm scripts

A job must never reference a script that does not exist. The workflow expects:
`lint`, `typecheck`, `build`, `docs:build`, and per-tier `test:<tier>` scripts
(`test:unit`, `test:integration`, `test:smoke`, `test:fuzz`, `test:e2e`) with
coverage variants that emit `coverage/<tier>.lcov` for the `coverage-<tier>`
artifacts.
