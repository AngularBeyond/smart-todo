# Component Integration Guide

This guide documents how Angular components (typically located in `pages/` or `components/`) provide, inject, and bind to a feature-scoped Signal Store.

---

## 1. Providing the Store in Component Providers

Feature stores must be provided in the component's `providers` array so each view instance gets a fresh store scoped to its lifecycle:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { FeatureStore } from '../../store';

@Component({
  selector: 'app-feature-page',
  standalone: true,
  imports: [/* imports */],
  // Provide the store at the component level
  providers: [FeatureStore],
  templateUrl: './feature-page.html',
  styleUrl: './feature-page.scss',
})
export class FeaturePage implements OnInit {
  // Inject the scoped store instance
  readonly store = inject(FeatureStore);

  // Directly expose store signals to template
  readonly items = this.store.items;
  readonly isLoading = this.store.isPending;
  readonly error = this.store.error;

  ngOnInit(): void {
    this.store.loadItems();
  }

  handleRefresh(): void {
    this.store.loadItems();
  }
}
```

---

## 2. Template Binding (Error Alert & Loading States)

Bind to the store's `error()` and `isPending()` signals directly in the component template:

```html
<!-- Error Alert Banner -->
@if (error(); as errorMessage) {
<div class="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 mb-6">
  <ng-icon name="lucideTriangleAlert" class="mt-0.5 size-4 text-destructive!" />
  <div class="flex-1">
    <p class="text-sm font-medium text-destructive">Operation Failed</p>
    <p class="text-sm text-muted-foreground">{{ errorMessage }}</p>
  </div>
  <button 
    type="button" 
    class="text-xs text-muted-foreground hover:text-foreground"
    (click)="store.clearError()">
    Dismiss
  </button>
</div>
}

<!-- Action Button with Loading Spinner -->
<button 
  hlmBtn 
  class="h-11 w-full" 
  type="submit" 
  [disabled]="isLoading()">
  @if (isLoading()) {
    <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
  } @else {
    Save Changes
  }
</button>
```
