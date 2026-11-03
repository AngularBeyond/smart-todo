import { describe, expect, it } from 'vitest';
import { formatRelativeTime, formatTodoMetadata } from './todo-date.pure';

describe('todo-date.pure', () => {
  const baseTime = new Date('2026-11-03T12:00:00Z');

  describe('formatRelativeTime', () => {
    it('returns "just now" for dates within 45 seconds', () => {
      const recent = new Date('2026-11-03T11:59:30Z').toISOString();
      expect(formatRelativeTime(recent, baseTime)).toBe('just now');
    });

    it('returns minutes ago for dates within an hour', () => {
      const fifteenMins = new Date('2026-11-03T11:45:00Z').toISOString();
      expect(formatRelativeTime(fifteenMins, baseTime)).toBe('15m ago');
    });

    it('returns hours ago for dates within 24 hours', () => {
      const twoHours = new Date('2026-11-03T10:00:00Z').toISOString();
      expect(formatRelativeTime(twoHours, baseTime)).toBe('2h ago');
    });

    it('returns days ago for dates within 7 days', () => {
      const threeDays = new Date('2026-10-31T12:00:00Z').toISOString();
      expect(formatRelativeTime(threeDays, baseTime)).toBe('3d ago');
    });
  });

  describe('formatTodoMetadata', () => {
    it('returns created string when updatedAt is absent or same as createdAt', () => {
      const created = new Date('2026-11-03T11:50:00Z').toISOString();
      expect(formatTodoMetadata(created, undefined, baseTime)).toBe('Created 10m ago');

      // Updated within 1 second of created
      const updatedClose = new Date('2026-11-03T11:50:01Z').toISOString();
      expect(formatTodoMetadata(created, updatedClose, baseTime)).toBe('Created 10m ago');
    });

    it('returns combined created and updated string when significantly updated', () => {
      const created = new Date('2026-11-03T10:00:00Z').toISOString();
      const updated = new Date('2026-11-03T11:55:00Z').toISOString();
      expect(formatTodoMetadata(created, updated, baseTime)).toBe('Created 2h ago • Updated 5m ago');
    });
  });
});
