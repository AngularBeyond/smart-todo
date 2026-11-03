export interface TodoItem {
  id: string;
  listId: string;
  userId: string;
  text: string;
  isCompleted: boolean;
  order: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  meta?: string;
  tag?: string;
  done?: boolean;
}

export interface PaginatedTodosResponse {
  items: TodoItem[];
  hasMore: boolean;
  nextCursor: string | null;
  meta: {
    totalCount: number;
    activeCount: number;
    completedCount: number;
    quotaLimit: number;
  };
}

export interface TodoResponse {
  todo: TodoItem;
}

export interface DeleteTodoResponse {
  message: string;
  deletedId: string;
  counts: {
    totalCount: number;
    activeCount: number;
    completedCount: number;
  };
}

export interface CreateTodoDto {
  text: string;
}

export interface UpdateTodoDto {
  text?: string;
  isCompleted?: boolean;
}

export interface ReorderTodoDto {
  order: number;
}

// Backward-compatibility aliases for existing mockup components
export interface TaskItem {
  id: string | number;
  text: string;
  meta?: string;
  tag?: string;
  done?: boolean;
  isCompleted?: boolean;
  order?: number;
}

export interface TaskList {
  name: string;
  count: number;
  starred: boolean;
  color: string;
}
