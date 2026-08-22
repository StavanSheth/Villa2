---
name: architect-discovery
description: "MANDATORY before substantial development work. Understand the user's requirements, inspect the existing codebase, find reusable logic, assess architecture, research authoritative references, and determine required changes."
---

# DISCOVERY RULES

1. USER FIRST
   Follow explicit user requirements, constraints, preferences, and technology choices.
   Ask before making material product, security, data, compatibility, or architectural decisions.

2. EXISTING CODE FIRST
   Inspect before creating.
   Understand structure, modules, dependencies, APIs, data, auth, tests, and infrastructure.

3. REUSE FIRST
   Search for existing functionality before implementing.
   REUSE → EXTEND → REFACTOR → REPLACE.
   Never duplicate suitable existing logic.

4. AUTHORITATIVE SOURCES
   Prefer official documentation, official repositories, standards, and trusted references.
   Learn the pattern; do not blindly copy it.
   Adapt it to the user's requirements and existing architecture.

5. ARCHITECTURE
   CURRENT → PROBLEMS → REQUIREMENTS → OPTIONS → TRADE-OFFS → TARGET.
   Choose the simplest architecture that satisfies the requirements.
   Never introduce complexity without justification.

6. IMPACT
   Before changing behavior, identify affected modules, APIs, data, UI, tests, integrations, and workflows.

7. EVOLUTION
   Preserve good existing work.
   Improve weak parts incrementally.
   Do not rewrite working systems without justification.

OUTPUT:
State only the relevant findings, required changes, and affected areas before implementation.
