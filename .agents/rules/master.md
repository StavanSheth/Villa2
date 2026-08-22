---
trigger: manual
---

# GITHUB SKILL ROUTING RULE

All skills MUST be resolved from this GitHub repository only:

https://github.com/StavanSheth/Skills or
C:\Users\Stavan\.gemini\config\skills

Never use hardcoded local Windows paths or skills from another repository unless explicitly requested.

## 1. Ponytail Workflow

For EVERY software task, first apply all available Ponytail skills together:

- StavanSheth/Skills/Ponytail/ponytail
- StavanSheth/Skills/Ponytail/ponytail-review
- StavanSheth/Skills/Ponytail/ponytail-audit
- StavanSheth/Skills/Ponytail/ponytail-debt
- StavanSheth/Skills/Ponytail/ponytail-help

If the required Ponytail skill does not exist in the GitHub repository, do not substitute another skill.

## 2. GitNexus Workflow

Whenever writing, modifying, reviewing, or analyzing code, use:

- StavanSheth/Skills/GitNexus

Always consult the GitNexus wiki/index information before making repository-level changes.

## 3. Architect Workflow

For production-level software changes, dynamically use the relevant Architect skill from:

- StavanSheth/Skills/Architect

Use the specific Architect skill according to the task:

- StavanSheth/Skills/Architect/architect-discovery → repository/codebase discovery, impact analysis, change planning
- StavanSheth/Skills/Architect/architect-design → architecture, APIs, module boundaries, repository structure
- StavanSheth/Skills/Architect/architect-data → database schemas, data models, queries, migrations
- StavanSheth/Skills/Architect/architect-quality → testing, code quality, security, reliability, operations

## 4. Routing

Frontend change:
→ StavanSheth/Skills/Architect/architect-discovery
→ StavanSheth/Skills/Architect/architect-design
→ StavanSheth/Skills/Architect/architect-quality

Backend change:
→ StavanSheth/Skills/Architect/architect-discovery
→ StavanSheth/Skills/Architect/architect-design
→ StavanSheth/Skills/Architect/architect-quality

Database/data change:
→ StavanSheth/Skills/Architect/architect-discovery
→ StavanSheth/Skills/Architect/architect-data
→ StavanSheth/Skills/Architect/architect-quality

Infrastructure/DevOps change:
→ StavanSheth/Skills/Architect/architect-discovery
→ StavanSheth/Skills/Architect/architect-design
→ StavanSheth/Skills/Architect/architect-quality

Full-stack change:
→ StavanSheth/Skills/Architect/architect-discovery
→ StavanSheth/Skills/Architect/architect-design
→ StavanSheth/Skills/Architect/architect-data (if database is affected)
→ StavanSheth/Skills/Architect/architect-quality

## 5. Mandatory Execution Order

For every software task:

UNDERSTAND
→ INSPECT
→ REUSE
→ APPLY PONYTAIL
→ APPLY GITNEXUS
→ APPLY RELEVANT ARCHITECT SKILL(S)
→ ASSESS
→ DESIGN
→ IMPLEMENT
→ VERIFY

Never blindly follow existing code.
Never blindly replace existing code.
Never duplicate suitable logic.
Never introduce unnecessary complexity.
Never make material decisions against explicit user requirements.
Never claim success without verification.

## 6. GitHub-Only Rule

The ONLY skill source for this workflow is:

StavanSheth/Skills

Use the skill folders by their repository paths:

- StavanSheth/Skills/Ponytail/...
- StavanSheth/Skills/GitNexus/...
- StavanSheth/Skills/Architect/...

Do NOT reference:
- C:\Projects\...
- local absolute skill paths
- skills from unrelated repositories
- assumed skill locations not present in the GitHub repository
