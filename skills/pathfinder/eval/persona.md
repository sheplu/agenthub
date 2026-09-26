# Persona: the interviewee's hidden knowledge

The driver answers the agent's questions **only** from this file. Rules:

- Reveal a fact only when a question actually asks for it. Never volunteer.
- If asked something not covered here, answer "I don't know, you decide"
  (the agent should then decide, state its reasoning, and record the
  decision as delegated).
- Give the **first answer** listed for a fact; give the **probed answer**
  only if the agent pushes back on the first one.
- Play the contradiction honestly: state both sides as written, and only
  resolve it if the agent surfaces the conflict explicitly.
- Playback and skip confirmations are judgements, not facts — never answer
  them with "I don't know". When the agent presents the DAG or asks to
  confirm skipping a category: confirm if it is consistent with this file;
  if it contradicts or misstates a fact here, point at the specific
  discrepancy and let the agent correct it.

## Facts (revealed only when asked)

### Business context & goals

- Real pain: the product team cannot get analytics faster than T+24h
  because the cron pipeline runs nightly. When something breaks in
  production, they cannot see the impact until the next day.
- Goal: product team sees key metrics within minutes of events occurring,
  not next-day.
- Success signal (probed — first answer is "the product team stops
  complaining"): the P95 data freshness is under 5 minutes, measured from
  event emission to dashboard visibility. The nightly cron job is fully
  decommissioned within 3 months of launch.
- Strategic priority: this is the team's top priority for Q4. Nothing else
  ships until the pipeline is live.

### Tech stack & architecture

- Existing stack: Python 3.11 cron jobs running on a single EC2 instance,
  writing to PostgreSQL 15. The cron jobs read from the application's
  PostgreSQL database directly (same cluster).
- Target: event-driven pipeline using Apache Kafka for ingestion. Events
  published by the main application (a Django monolith) via a new producer
  library. Consumers in Python (Faust or a similar stream-processing
  library).
- Dashboard: the product team wants Next.js (they already use it for the
  customer-facing app). Backend-for-frontend (BFF) serves pre-aggregated
  data from a new ClickHouse instance.
- Infrastructure: AWS, managed via Terraform. Kafka on Amazon MSK.
  ClickHouse on a self-managed EC2 cluster (no managed service available in
  their region).
- **Vague answer to probe**: if asked about the event schema or data model,
  first answer is "we'll just send everything." Probed answer: events are
  typed with a JSON Schema registry; initial event types are `page_view`,
  `feature_used`, `error_occurred`, and `subscription_changed` — four types
  only, scoped to product analytics.

### Team & resources

- Team: 4 engineers — 2 backend (strong Python, some Kafka experience),
  1 frontend (Next.js specialist), 1 platform/infra (Terraform, AWS).
- No dedicated data engineer. The backend engineers will learn
  ClickHouse on the job.
- Everyone is full-time on this project for Q4. No other commitments.
- Technical decisions are made by the tech lead (one of the backend
  engineers). Architecture changes need a thumbs-up from the CTO but no
  formal review process.

### Timeline & phases

- Hard deadline: end of Q4 (December 31). The nightly cron must be fully
  replaced by then.
- MVP (6 weeks, mid-November): Kafka pipeline running for `page_view`
  events, one dashboard chart showing page views in near-real-time.
  Nightly cron still runs in parallel as a safety net.
- Full launch (end of Q4): all four event types flowing, full dashboard,
  nightly cron decommissioned.
- No external dependencies on dates. No conference or partner launch.

### Project boundaries

- In scope: event ingestion pipeline, ClickHouse storage, Next.js
  dashboard, producer library in the Django monolith, Terraform for new
  infra, migration from cron to stream.
- Out of scope: ML/predictive analytics, alerting/notifications (separate
  project next quarter), changes to the customer-facing Next.js app.
- Non-goal: this is not a general-purpose data platform — it serves product
  analytics only. Requests to ingest logs, traces, or business metrics
  should be refused.
- Backward compatibility: the nightly cron currently produces CSV exports
  consumed by the finance team. Those exports must continue to work, sourced
  from ClickHouse once the migration is complete.

### Cross-cutting concerns

- Testing: integration tests for the pipeline (produce event → verify it
  lands in ClickHouse), unit tests for consumers and the producer library.
  No formal coverage target but "reasonable coverage" (probed: at least 80%
  line coverage on the producer library and consumers).
- CI/CD: GitHub Actions. The Django monolith already has CI; the new
  services need their own pipelines. Deploy via Terraform + a deploy script
  (no Kubernetes).
- Security: events must not contain PII. The producer library must strip or
  hash user identifiers before publishing. ClickHouse is internal-only, no
  public access.
- Documentation: architecture decision record (ADR) for the pipeline
  design, API docs for the producer library, runbook for ClickHouse
  operations.
- Observability: consumer lag monitoring on Kafka (alert if lag > 5
  minutes), ClickHouse query performance dashboards.

## The contradiction (agent must catch it)

- When asked about the data pipeline approach: "We want real-time
  streaming — events should flow continuously."
- When asked about the dashboard update frequency or data freshness: "The
  dashboard refreshes every 15 minutes from batch aggregations in
  ClickHouse."
- These conflict: true streaming with 15-minute batch aggregations is a
  hybrid, not pure streaming. If the agent quotes both and asks which holds:
  resolution is that **ingestion is streaming** (events flow into
  ClickHouse continuously via Kafka consumers) but **dashboard reads from
  materialised views** that ClickHouse refreshes on a schedule. The refresh
  interval is 1 minute for the MVP (acceptable latency), potentially
  sub-minute later. The "15 minutes" was a misremembering of the current
  cron cadence for a different report.

## Not covered here

Anything else (UI design details, specific chart types, naming conventions,
branching strategy): "I don't know, you decide."
