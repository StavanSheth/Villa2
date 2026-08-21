# Production Test Architecture & Discovery

## Discovered Stack
- **Frontend Framework:** Next.js (Multiple distinct apps via Turborepo: `admin`, `api`, `auth`, `booking`, `customer`, `landing`, `owner`, `staff`, `superadmin`, `web`)
- **Backend Framework:** Next.js API Routes (Serverless via Hono, inferred from package.json) & Node.js Domain Services
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Edge JWTs with Jose, likely Firebase integration (Firebase UID fields in DB schema)
- **Authorization/RBAC:** Custom Roles (`CUSTOMER`, `STAFF`, `OWNER`, `ADMIN`, `SUPER_ADMIN`)
- **Payment Provider:** Razorpay (Webhooks, captured payments)
- **Queue System / State Locks:** Upstash Redis (`@upstash/redis`)
- **Worker System:** Pending Discovery (Likely Next.js background workers or Edge functions processing Redis queues)
- **Object Storage:** Unconfirmed (Potentially Cloudflare R2 or AWS S3 based on typical setups)
- **Test Runner:** Vitest (for unit/integration testing)

## Testing Boundaries & Control Plane

The new Production Readiness Validation (PRV) harness will be built in the `tests/production-readiness/` directory.

### GUI Testing (Playwright)
Playwright will be installed and configured to programmatically validate UI boundaries using accessible selectors and test-ids. No manual clicks.
- Owner Dashboard UI
- Booking Checkout UI
- Admin/Staff Management UI

### API & Service Testing (Vitest + HTTP Clients)
Direct API invocation to test boundaries, state transitions, business logic, and security:
- RBAC bypassing
- Double bookings
- Promo validation
- Razorpay webhook simulation

### Concurrency & Chaos Testing
- Database transaction isolation (`Serializable` transactions).
- Thundering herd scenarios (tested via `Promise.allSettled` to the API layer).
- Mocking external dependencies (Redis timeouts, DB failover simulation) to test idempotency.

## Failure Points to Secure
1. **Double Booking:** Simultaneous requests for the same dates.
2. **Payment Replay:** Webhook deduplication.
3. **Refund Loops:** Partial/Full refund idempotency.
4. **RBAC Isolation:** Tenant data isolation across owner dashboards.
