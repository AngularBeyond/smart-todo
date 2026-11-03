/**
 * Formats todo timestamps into a clean, human-readable metadata subtitle.
 * Examples:
 * - "Created just now"
 * - "Created 5m ago"
 * - "Created 2h ago • Updated just now"
 * - "Created Oct 24 • Updated 10m ago"
 */
export function formatRelativeTime(dateInput: string | Date, now: Date = new Date()): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const diffMs = now.getTime() - date.getTime();

  if (isNaN(diffMs) || diffMs < 0) {
    return 'just now';
  }

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) {
    return 'just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // Format as short month + day (e.g., "Oct 24")
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTodoMetadata(
  createdAt: string | Date,
  updatedAt?: string | Date,
  now: Date = new Date(),
): string {
  if (!createdAt) return '';

  const createdStr = formatRelativeTime(createdAt, now);
  if (!updatedAt) {
    return `Created ${createdStr}`;
  }

  const createdTime = (typeof createdAt === 'string' ? new Date(createdAt) : createdAt).getTime();
  const updatedTime = (typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt).getTime();

  // If updated is within 2 seconds of created, treat as not modified yet
  if (Math.abs(updatedTime - createdTime) < 2000) {
    return `Created ${createdStr}`;
  }

  const updatedStr = formatRelativeTime(updatedAt, now);
  return `Created ${createdStr} • Updated ${updatedStr}`;
}
