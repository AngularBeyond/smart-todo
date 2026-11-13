# ADR-006: Fractional Float Indexing for Order Positioning

## Status
Accepted

## Date
2026-11-04

## Context
The Smart TODO application allows users to manually reorder active todo items within a list via drag-and-drop. Traditional relational database ordering techniques present significant scalability and concurrency drawbacks:
1. **Integer Rank Re-indexing ($O(N)$ write amplification):** If items are indexed with contiguous integers (`1, 2, 3, 4, ...`), inserting an item at the beginning or middle of a list requires shifting and updating the `order` column of every subsequent row ($O(N)$ database updates). This causes row-lock contention, excessive transaction log volume, and write overhead.
2. **Linked Lists in RDBMS (`prev_id` / `next_id`):** Representing order via self-referential foreign keys requires recursive queries or expensive graph traversals to render sorted lists, and moving an item requires multi-row transactional updates to repair links.

We needed an ordering mechanism that allows arbitrary reordering with an $O(1)$ single-row update, compatible with MySQL and Prisma ORM.

## Decision
We decided to implement **Fractional Float Indexing** with an **Automatic Normalization Rebalance Mechanism**:
1. **Float Data Type:**
   - Define the `order` column in Prisma schema and MySQL as a `Float` (double-precision floating-point number).
   - All lists are queried with `ORDER BY order ASC, id ASC`.
2. **Order Step Constants & Midpoint Math:**
   - Define a spacing baseline `ORDER_STEP = 1000`.
   - **Initial / Empty List:** First item receives `order = 1000`.
   - **Prepend (Top of List):** New item receives `firstItem.order - ORDER_STEP` (or `minActiveOrder - ORDER_STEP`).
   - **Append (Bottom of List):** New item receives `lastItem.order + ORDER_STEP`.
   - **Insert Between Two Items:** Placing item between neighbor $A$ and neighbor $B$ calculates the midpoint:
     $$\text{order}_{\text{new}} = \frac{\text{order}_A + \text{order}_B}{2}$$
3. **Uncomplete-to-Top Rule:**
   - When a completed todo is toggled back to active (uncompleted), it automatically moves to the top of the active list with `order = (minActiveOrder ?? 2000) - ORDER_STEP`.
4. **Precision Guard & Rebalancing:**
   - Repeatedly inserting between the same items narrows the delta between floating-point numbers.
   - If the distance between adjacent items falls below a safety threshold:
     $$|\text{order}_i - \text{order}_{i-1}| < 10^{-9}$$
   - The backend `TodosService.reorderTodo` executes a normalization routine within a database transaction, re-spacing all active items in the list uniformly:
     $$\text{order}_i = (i + 1) \times \text{ORDER_STEP}$$

## Alternatives Considered

### Alternative 1: Integer Array on List Entity (`todo_ids: string[]`)
- **Pros:** No order column on individual todo rows.
- **Cons:** Serializing arrays in JSON/text columns violates normalization, prevents SQL-level pagination (`LIMIT`/`OFFSET`), and creates severe race conditions when two clients add or edit different items concurrently in the same list.
- **Rejected:** Fails multi-user concurrency and pagination requirements.

### Alternative 2: Lexicographical String Indexing (e.g., Lexorank / fractional-indexing strings)
- **Pros:** Arbitrary precision string representations avoid IEEE 754 float underflow.
- **Cons:** Strings take more storage, string sorting overhead in MySQL is slower than native floating-point math, and client-server encoding/decoding adds complexity.
- **Rejected:** Because our application enforces a strict quota of maximum 40 todos per list, IEEE 754 double precision ($53$ bits of mantissa) requires dozens of consecutive midpoint splits at the exact same position before nearing $10^{-9}$, which is safely handled by our automatic rebalance routine.

### Alternative 3: Contiguous Integer Re-indexing on Every Move
- **Pros:** Conceptually simple; order integers remain $1, 2, 3$.
- **Cons:** Triggers up to 40 row updates on every drag event. Unacceptable database write amplification and lock contention.
- **Rejected:** Unnecessary performance penalty.

## Consequences

### Positive
- **$O(1)$ Reordering:** 99.9% of drag-and-drop operations result in a single `UPDATE todos SET order = :newOrder WHERE id = :id` query.
- **Simple Client Math:** Client-side drag-and-drop pure functions (`calculateNewOrder`) can compute the target order optimistically before API round-trips.
- **Robust Precision Protection:** The $10^{-9}$ threshold and transaction-safe normalization eliminate floating-point collision risk.

### Trade-offs / Considerations
- Requires database transactions during the rare rebalance pass to ensure consistent ordering across all list items.
- Order values can be negative (due to prepending with `minOrder - 1000`), which is fully supported by MySQL `Float` and sorting operators.
