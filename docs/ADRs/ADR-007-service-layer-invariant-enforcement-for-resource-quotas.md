# ADR-007: Service-Layer Invariant Enforcement for Resource Quotas

## Status
Accepted

## Date
2026-11-04

## Context
As defined in the Product Requirements Document (`docs/01-PRD.md`), the Smart TODO application enforces strict resource limits for demonstration and resource governance:
- **Maximum Lists per User:** $3$ lists (`MAX_LISTS_PER_USER = 3`).
- **Maximum Todos per List:** $40$ todos (`MAX_TODOS_PER_LIST = 40`), active and completed combined.

If users exceed these boundaries, the system must reject creation requests with clear, user-facing error messages, and frontend UI controls must disable addition buttons while displaying quota badges (e.g., `3/3 lists`, `40/40 tasks`).

Enforcing business invariants across a multi-tenant client-server architecture presents architectural choices:
1. **Client-side only validation:** Easily bypassed via direct API calls or curl, leading to database pollution.
2. **Database-level SQL triggers / check constraints:** MySQL check constraints cannot easily perform subqueries across table counts, and triggers throw low-level database exceptions that are cumbersome to map to clean API contracts.
3. **HTTP Controller guards:** Too distant from database transactions, making race conditions possible if two requests arrive concurrently.

## Decision
We decided to enforce resource quotas strictly within **Transactional NestJS Application Services**:
1. **Centralized Quota Constants**:
   - Define constants in `src/common/constants/quotas.constants.ts`:
     ```typescript
     export const MAX_LISTS_PER_USER = 3;
     export const MAX_TODOS_PER_LIST = 40;
     ```
2. **Atomic Invariant Checks Inside Database Transactions**:
   - In `TodoListsService.createTodoList`, execute count verification within a Prisma transaction (`prisma.$transaction`):
     ```typescript
     const count = await this.todoListsRepository.countByUserId(userId, tx);
     if (count >= MAX_LISTS_PER_USER) {
       throw new BadRequestException({
         code: 'DEMO_QUOTA_LISTS_EXCEEDED',
         message: `Demo quota reached: You can create a maximum of ${MAX_LISTS_PER_USER} lists.`,
         quotaLimit: MAX_LISTS_PER_USER,
       });
     }
     ```
   - In `TodosService.createTodo`, count all items in the target list (active + completed) within the transaction:
     ```typescript
     const totalCount = await this.todosRepository.countTotalByListId(listId, tx);
     if (totalCount >= MAX_TODOS_PER_LIST) {
       throw new BadRequestException({
         code: 'DEMO_QUOTA_TODOS_EXCEEDED',
         message: `Demo quota reached: You can create a maximum of ${MAX_TODOS_PER_LIST} todos per list.`,
         quotaLimit: MAX_TODOS_PER_LIST,
       });
     }
     ```
3. **Uniform Error Serialization**:
   - NestJS `GlobalHttpExceptionFilter` intercepts `BadRequestException` and formats the response according to the global `ApiResponse<T>` envelope with `success: false`:
     ```json
     {
       "success": false,
       "error": {
         "code": "DEMO_QUOTA_TODOS_EXCEEDED",
         "message": "Demo quota reached: You can create a maximum of 40 todos per list.",
         "details": { "quotaLimit": 40 }
       }
     }
     ```
4. **Client-Side Proactive UX & Disabled States**:
   - In the Angular frontend, `TodoListsStore` and `TodosStore` compute reactive boolean signals (`isAtListLimit`, `isAtTodoLimit`) using computed signals. Creation bars and modal triggers are disabled in the UI when the limit is reached, preventing unnecessary network traffic.

## Alternatives Considered

### Alternative 1: Database Triggers (BEFORE INSERT)
- **Pros:** Hard database-level guarantee.
- **Cons:** Triggers introduce database-specific procedural code outside version-controlled application repositories, complicate unit testing with in-memory or mock databases, and return unformatted SQL error strings that require messy regex parsing in exception filters.
- **Rejected:** Business rules belong in application services, not database triggers.

### Alternative 2: Frontend-Only Validation
- **Pros:** Fast client response, zero server-side checking code.
- **Cons:** Insecure; any user or agent can bypass the UI using HTTP requests or developer tools.
- **Rejected:** Violates basic web application security and multi-tenant integrity.

### Alternative 3: Asynchronous Background Purge / Reconciliation
- **Pros:** Allows unbounded inserts and cleans up excess later.
- **Cons:** Extremely poor user experience; users create tasks only to see them deleted later without notice.
- **Rejected:** Hard limits must be synchronous and rejected immediately at creation time.

## Consequences

### Positive
- **Guaranteed Consistency:** Enforcing checks inside database transactions prevents race conditions from concurrent duplicate submissions.
- **Structured Error Contracts:** Clients receive standardized error codes (`DEMO_QUOTA_LISTS_EXCEEDED`, `DEMO_QUOTA_TODOS_EXCEEDED`) allowing tailored UI banners and toast messaging.
- **Comprehensive Testability:** Quota invariant edge cases (e.g. creating when count = 39 succeeds, count = 40 fails) are unit tested in `todos.service.spec.ts` and `todo-lists.service.spec.ts` with mocked repository counts.

### Trade-offs / Considerations
- Every list or todo creation performs an initial `COUNT(*)` query before inserting. With indexed foreign keys (`userId` on lists, `listId` on todos), this query executes in sub-millisecond time.
