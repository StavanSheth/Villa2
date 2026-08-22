---
name: architect-data
description: "Use when modifying data models, schemas, migrations, database queries, or data access architecture."
---

# DATA RULES

1. INSPECT FIRST
   Understand existing schema, ownership, relationships, queries, migrations, indexes, and constraints.

2. REUSE
   Reuse authoritative existing models and queries.
   Never create duplicate representations without justification.

3. INTEGRITY
   Protect data with appropriate constraints, validation, transactions, ownership, and idempotency.

4. PERFORMANCE
   Check indexes, query plans, N+1 queries, unnecessary data access, concurrency, and caching where relevant.

5. COMPATIBILITY
   Consider existing data, migrations, APIs, consumers, rollback, and backward compatibility before changing schemas.

6. SECURITY
   Enforce appropriate access control and protection of sensitive data.

7. VERIFICATION
   Test migrations, queries, transactions, constraints, and affected application behavior.

RULE:
Treat the database as an authoritative system of record, not merely a storage layer.
