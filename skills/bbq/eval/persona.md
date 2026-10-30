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
- Playback and skip confirmations are judgments, not facts — never answer
  them with "I don't know". When the agent plays back its understanding or
  asks to confirm skipping a category: confirm if it is consistent with this
  file; if it contradicts or misstates a fact here, point at the specific
  discrepancy and let the agent correct it.

## Facts (revealed only when asked)

### Goals & success criteria

- Real pain: pre-deploy checklists live in Slack threads and items get
  missed; two incidents last quarter were caused by skipped checklist steps.
- Goal: every deploy runs its checklist to completion, with sign-offs
  recorded.
- Success signal (probed — first answer is "fewer incidents, I guess"):
  zero missed checklist items over a quarter, measured from the tool's own
  records.

### Users & stakeholders

- Team: 6 SREs. Primary user: the *release captain* — a weekly rotating
  role that runs the deploy.
- Vetoer: the compliance officer, who must approve any new tool that stores
  operational records.

### Domain & language

- "Deployment" means one ArgoCD sync of one service to production. A
  multi-service coordinated ship is called a "release" and is out of scope.
- "Checklist" is a fixed, versioned template per service — not a free-form
  todo list.

### Architecture & integration

- Deploys go through ArgoCD on a self-managed Kubernetes cluster.
- The tool must read deploy events from ArgoCD webhooks; no polling.
- **Vague answer to probe**: if asked about performance, first answer is
  "it needs to feel snappy". Probed answer: checklist page loads in under 2
  seconds over the office VPN.

### Constraints & non-goals

- Hard constraint: no new external SaaS — compliance requires operational
  records to stay self-hosted.
- Non-goal: this is not a general todo/project-management app; feature
  requests in that direction should be refused.
- Budget: whatever runs on the existing cluster; no new infrastructure
  spend.

### Edge cases & risks

- Rollbacks are deploys too and need their own (shorter) checklist.
- If ArgoCD webhooks are down, deploys still happen — the tool must allow
  manually opening a checklist after the fact, flagged as manual.

## The contradiction (agent must catch it)

- When asked who can use/edit the tool: "everyone on the team should be
  able to edit everything."
- When asked about sign-offs (or any accountability/audit question): "only
  the release captain can sign off checklist items."
- These conflict for checklist items. If the agent quotes both and asks
  which holds: resolution is that anyone can view and comment, only the
  release captain can sign off, and templates are edited by anyone but
  changes are versioned.

## Not covered here

Anything else (tech stack of the tool itself, UI details, naming): "I don't
know, you decide."
