import { TagItem } from '../models';

export const INITIAL_TAGS: TagItem[] = [
  { name: 'Planning', color: 'bg-primary', tasks: 8, description: 'Roadmaps, priorities, and weekly planning' },
  { name: 'Work', color: 'bg-chart-2', tasks: 12, description: 'Projects and team commitments' },
  { name: 'Personal', color: 'bg-chart-3', tasks: 6, description: 'Life admin and personal goals' },
  { name: 'Creative', color: 'bg-chart-4', tasks: 4, description: 'Ideas, writing, and inspiration' },
  { name: 'Setup', color: 'bg-chart-5', tasks: 2, description: 'Workspace and onboarding tasks' },
];
