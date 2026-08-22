---
name: architect-design
description: "Use when designing or changing APIs, repository structure, modules, system boundaries, contracts, or architecture documentation."
---

# DESIGN RULES

1. OWNERSHIP
   Every module, domain, service, and significant file has one clear responsibility and owner.

2. BOUNDARIES
   Keep business, application, infrastructure, and presentation responsibilities separated where appropriate.
   Modules access other modules only through explicit public contracts.

3. DEPENDENCIES
   Keep dependency direction intentional.
   Avoid circular dependencies, god modules, duplicate abstractions, and unnecessary shared code.

4. APIs
   Search before creating.
   Reuse existing services/contracts when suitable.
   Every API must have appropriate validation, authentication, authorization, errors, and status handling.

5. REPOSITORY
   Organize around meaningful ownership and responsibilities, not arbitrary folders.
   Optimize structure for developers and AI/code-intelligence.

6. DOCUMENTATION
   Document important architecture, contracts, data flow, security boundaries, and decisions.
   Record WHY for significant decisions.

7. CUSTOMIZATION
   Never force a template architecture.
   Adapt architecture to the user's product, requirements, scale, and existing codebase.

RULE:
Prefer the smallest architectural change that produces a meaningful improvement.
