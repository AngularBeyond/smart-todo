export interface TaskItem {
  id: number;
  text: string;
  meta: string;
  tag: string;
  done: boolean;
}

export interface TaskList {
  name: string;
  count: number;
  starred: boolean;
  color: string;
}
