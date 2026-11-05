import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { TagsStore } from './tags.store';
import { INITIAL_TAGS } from '../constants';

describe('TagsStore', () => {
  let store: InstanceType<typeof TagsStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TagsStore],
    });
    store = TestBed.inject(TagsStore);
  });

  describe('Initial State & Computed Signals', () => {
    it('should initialize with initial tags and empty query', () => {
      expect(store.tags()).toEqual(INITIAL_TAGS);
      expect(store.query()).toBe('');
      expect(store.isPending()).toBe(false);
      expect(store.isFulfilled()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should compute totalTasksCount correctly from initial tags', () => {
      const expectedTotal = INITIAL_TAGS.reduce((sum, t) => sum + t.tasks, 0);
      expect(store.totalTasksCount()).toBe(expectedTotal);
    });

    it('should compute visibleTags returning all tags when query is empty', () => {
      expect(store.visibleTags()).toEqual(INITIAL_TAGS);
    });

    it('should filter visibleTags by name case-insensitively', () => {
      store.setQuery('creative');
      expect(store.visibleTags().length).toBe(1);
      expect(store.visibleTags()[0].name).toBe('Creative');
    });

    it('should filter visibleTags by description case-insensitively', () => {
      store.setQuery('priorities');
      expect(store.visibleTags().length).toBe(1);
      expect(store.visibleTags()[0].name).toBe('Planning');
    });

    it('should return empty visibleTags when query matches nothing', () => {
      store.setQuery('nonexistent-tag-query');
      expect(store.visibleTags()).toEqual([]);
    });
  });

  describe('Methods', () => {
    it('should set query state', () => {
      store.setQuery('testing');
      expect(store.query()).toBe('testing');
    });

    it('should delete a tag by name and recalculate totalTasksCount', () => {
      const initialTotal = store.totalTasksCount();
      const planningTasks = INITIAL_TAGS.find((t) => t.name === 'Planning')!.tasks;

      store.deleteTag('Planning');

      expect(store.tags().some((t) => t.name === 'Planning')).toBe(false);
      expect(store.tags().length).toBe(INITIAL_TAGS.length - 1);
      expect(store.totalTasksCount()).toBe(initialTotal - planningTasks);
    });
  });

  describe('State Edge Cases with unprotected', () => {
    it('should compute zero totalTasksCount when tags are empty', () => {
      patchState(unprotected(store), { tags: [] });
      expect(store.totalTasksCount()).toBe(0);
      expect(store.visibleTags()).toEqual([]);
    });
  });
});
