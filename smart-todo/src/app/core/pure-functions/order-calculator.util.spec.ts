import { describe, expect, it } from 'vitest';
import { calculateNewOrder, ORDER_STEP } from './order-calculator.util';

describe('calculateNewOrder', () => {
  it('should return ORDER_STEP (1000) for an empty list', () => {
    expect(calculateNewOrder([], 0)).toBe(ORDER_STEP);
    expect(calculateNewOrder([], 5)).toBe(ORDER_STEP);
  });

  it('should calculate new order when item is dropped at the very top (index 0)', () => {
    const items = [{ order: 1000 }, { order: 2000 }, { order: 3000 }];
    const result = calculateNewOrder(items, 0);
    expect(result).toBe(0);
  });

  it('should calculate negative order if first item is already <= 1000', () => {
    const items = [{ order: 500 }, { order: 1500 }];
    const result = calculateNewOrder(items, 0);
    expect(result).toBe(-500);
  });

  it('should calculate new order when item is dropped at the very bottom (last index)', () => {
    const items = [{ order: 1000 }, { order: 2000 }, { order: 3000 }];
    const result = calculateNewOrder(items, 3);
    expect(result).toBe(4000);
  });

  it('should calculate midpoint order when dropped between two items', () => {
    const items = [{ order: 1000 }, { order: 2000 }, { order: 3000 }];
    // Drop at index 1: between index 0 (1000) and index 1 (2000)
    const result = calculateNewOrder(items, 1);
    expect(result).toBe(1500);
  });

  it('should handle fractional midpoint order accurately', () => {
    const items = [{ order: 1000 }, { order: 1500 }];
    const result = calculateNewOrder(items, 1);
    expect(result).toBe(1250);
  });
});
