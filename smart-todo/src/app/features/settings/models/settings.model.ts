export interface WorkspaceSettings {
  appearance: 'light' | 'dark' | 'system';
  startOfWeek: 'Monday' | 'Sunday';
  notifications: boolean;
  defaultList: string;
  dailyTaskLimit: number;
}
