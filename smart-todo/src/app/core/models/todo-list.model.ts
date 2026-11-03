export interface TodoListSummary {
  id: string;
  name: string;
  isStarred: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  totalCount: number;
  activeCount: number;
}

export interface TodoListsResponse {
  lists: TodoListSummary[];
}

export interface TodoListResponse {
  list: TodoListSummary;
}

export interface DeleteTodoListResponse {
  message: string;
}
