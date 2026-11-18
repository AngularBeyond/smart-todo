import { WorkspaceSettings } from '../models';

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  appearance: 'light',
  startOfWeek: 'Monday',
  notifications: true,
  defaultList: 'My Tasks',
  dailyTaskLimit: 40,
  maxLists: 3,
};
