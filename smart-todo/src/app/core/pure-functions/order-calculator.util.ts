export const ORDER_STEP = 1000;

export interface OrderableItem {
  order: number;
}

/**
 * Calculates a new Float order value for placing an item at a specific target index
 * in an ordered array.
 *
 * - Empty list: 1000
 * - Top of list (index 0): firstItem.order - ORDER_STEP
 * - Bottom of list (last index): lastItem.order + ORDER_STEP
 * - Between item A (targetIndex - 1) and B (targetIndex): (orderA + orderB) / 2
 */
export function calculateNewOrder(
  items: OrderableItem[],
  targetIndex: number,
): number {
  if (!items || items.length === 0) {
    return ORDER_STEP;
  }

  if (targetIndex <= 0) {
    const firstOrder = items[0]?.order ?? 0;
    return firstOrder - ORDER_STEP;
  }

  if (targetIndex >= items.length) {
    const lastOrder = items[items.length - 1]?.order ?? 0;
    return lastOrder + ORDER_STEP;
  }

  const prevOrder = items[targetIndex - 1]?.order ?? 0;
  const nextOrder = items[targetIndex]?.order ?? 0;

  return (prevOrder + nextOrder) / 2;
}
