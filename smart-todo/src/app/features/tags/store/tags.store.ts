import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { withRequestStatus } from '@core';
import { TagItem } from '../models';
import { INITIAL_TAGS } from '../constants';

export interface TagsState {
  tags: TagItem[];
  query: string;
}

const initialTagsState: TagsState = {
  tags: INITIAL_TAGS,
  query: '',
};

export const TagsStore = signalStore(
  withState<TagsState>(initialTagsState),
  withRequestStatus(),
  withComputed(({ tags, query }) => ({
    visibleTags: computed(() => {
      const q = query().toLowerCase().trim();
      return q ? tags().filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) : tags();
    }),
    totalTasksCount: computed(() => tags().reduce((sum, t) => sum + t.tasks, 0)),
  })),
  withMethods((store) => ({
    setQuery(query: string): void {
      patchState(store, { query });
    },
    deleteTag(name: string): void {
      patchState(store, {
        tags: store.tags().filter((t) => t.name !== name),
      });
    },
  })),
);
