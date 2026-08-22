---
name: architect-quality
description: "Use when implementing, modifying, reviewing, testing, debugging, or securing production code."
---

# QUALITY RULES

1. CORRECTNESS
   Code must have clear responsibility, predictable behavior, validation, error handling, and appropriate typing.

2. REUSE
   Do not duplicate existing functionality.
   Prefer existing abstractions when they are correct and maintainable.

3. SECURITY
   Check authentication, authorization, input validation, secrets, injection, sensitive data, access control, and abuse risks.

4. RELIABILITY
   Consider failures, timeouts, retries, idempotency, transactions, concurrency, race conditions, and partial failures where relevant.

5. PERFORMANCE
   Avoid unnecessary computation, database access, network calls, memory usage, and inefficient rendering.

6. OPERABILITY
   Add appropriate logging, metrics, health checks, and error visibility.

7. VERIFICATION
   Run applicable type checks, linting, unit, integration, contract, database, security, build, E2E, regression, and architecture checks.

8. FAILURE LOOP
   FAIL → FIND ROOT CAUSE → FIX → RERUN → VERIFY.
   Never suppress failures to claim success.

9. PRODUCTION CLAIM
   Never claim "production ready" without passing the applicable quality gates.

RULE:
Correctness and security take priority over speed or architectural elegance.
