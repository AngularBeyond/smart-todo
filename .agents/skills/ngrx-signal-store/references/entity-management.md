### Entity Management (@ngrx/signals/entities)

The `@ngrx/signals/entities` plugin provides `withEntities` and a collection of functional updaters for managing arrays of items.

#### 1. Basic Setup (`withEntities`)
By default, entities must contain an `id` property of type `EntityId` (`string | number`).

```typescript
import { signalStore } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

export type Todo = { id: number; text: string; completed: boolean };

export const TodosStore = signalStore(
  withEntities<Todo>()
);
// Injects: ids: Signal<EntityId[]>, entityMap: Signal<EntityMap<Todo>>, entities: Signal<Todo[]>
```

#### 2. Functional Entity Updaters
Use entity updaters inside `patchState` calls.

```typescript
import { patchState, signalStore, withMethods } from '@ngrx/signals';
import {
  addEntity, addEntities, prependEntity, updateEntity,
  updateEntities, updateAllEntities, setEntity, setEntities,
  setAllEntities, upsertEntity, removeEntity, removeEntities,
  removeAllEntities, withEntities
} from '@ngrx/signals/entities';

export const TodosStore = signalStore(
  withEntities<Todo>(),
  withMethods((store) => ({
    addTodo(todo: Todo): void {
      patchState(store, addEntity(todo));
    },
    addMultiple(todos: Todo[]): void {
      patchState(store, addEntities(todos));
    },
    toggleTodo(id: number): void {
      patchState(store, updateEntity({ id, changes: (t) => ({ completed: !t.completed }) }));
    },
    completeAll(): void {
      patchState(store, updateAllEntities({ completed: true }));
    },
    removeDone(): void {
      patchState(store, removeEntities((t) => t.completed));
    },
    reset(): void {
      patchState(store, removeAllEntities());
    },
  }))
);
```

#### 3. Custom Entity Identifiers (`selectId`)
If the entity identifier property is not `id`, specify a `selectId` function.

```typescript
import { patchState, signalStore, withMethods } from '@ngrx/signals';
import { addEntities, SelectEntityId, setEntity, withEntities } from '@ngrx/signals/entities';

export type Product = { sku: string; name: string; price: number };
const selectId: SelectEntityId<Product> = (p) => p.sku;

export const ProductStore = signalStore(
  withEntities<Product>(),
  withMethods((store) => ({
    addProduct(product: Product): void {
      patchState(store, setEntity(product, { selectId }));
    },
    addProducts(products: Product[]): void {
      patchState(store, addEntities(products, { selectId }));
    },
  }))
);
```

#### 4. Named Entity Collections
Manage distinct entity collections within the same store or provide clear collection prefixes.

```typescript
import { patchState, signalStore, type, withMethods } from '@ngrx/signals';
import { addEntity, removeEntity, withEntities } from '@ngrx/signals/entities';

export type Book = { id: string; title: string };
export type Author = { id: string; name: string };

export const LibraryStore = signalStore(
  withEntities({ entity: type<Book>(), collection: 'book' }),
  withEntities({ entity: type<Author>(), collection: 'author' }),
  withMethods((store) => ({
    addBook(book: Book): void {
      patchState(store, addEntity(book, { collection: 'book' }));
    },
    addAuthor(author: Author): void {
      patchState(store, addEntity(author, { collection: 'author' }));
    },
  }))
);
// Exposes: bookIds, bookEntityMap, bookEntities, authorIds, authorEntityMap, authorEntities
```

#### 5. `entityConfig` Helper
Eliminate repetitive configuration when custom `collection` names or `selectId` functions are used.

```typescript
import { patchState, signalStore, type, withMethods } from '@ngrx/signals';
import { addEntity, entityConfig, removeEntity, withEntities } from '@ngrx/signals/entities';

export type Item = { key: number; name: string };

const itemConfig = entityConfig({
  entity: type<Item>(),
  collection: 'item',
  selectId: (item) => item.key,
});

export const ItemStore = signalStore(
  withEntities(itemConfig),
  withMethods((store) => ({
    addItem(item: Item): void {
      patchState(store, addEntity(item, itemConfig));
    },
    removeItem(key: number): void {
      patchState(store, removeEntity(key, itemConfig));
    },
  }))
);
```

#### 6. Private Entity Collections
Prefix the collection name with `_` to encapsulate entity maps and IDs, exposing only selected computed arrays.

```typescript
import { Component, inject } from '@angular/core';
import { signalStore, type, withComputed } from '@ngrx/signals';
import { entityConfig, withEntities } from '@ngrx/signals/entities';

export type User = { id: number; name: string };

const userConfig = entityConfig({
  entity: type<User>(),
  collection: '_user', // Private collection
});

export const UsersStore = signalStore(
  withEntities(userConfig),
  withComputed(({ _userEntities }) => ({
    users: _userEntities, // Expose public computed signal
  }))
);
```
