import { DimItem } from 'app/inventory/item-types';
import simpleFilters from './simple';

describe('locked/unlocked filters', () => {
  const lockedFilter = simpleFilters.find((f) =>
    Array.isArray(f.keywords) ? f.keywords.includes('locked') : f.keywords === 'locked',
  );
  const unlockedFilter = simpleFilters.find((f) =>
    Array.isArray(f.keywords) ? f.keywords.includes('unlocked') : f.keywords === 'unlocked',
  );

  // Mock DimItem objects for testing
  const createMockItem = (lockable: boolean, locked: boolean): Partial<DimItem> => ({
    lockable,
    locked,
  });

  beforeEach(() => {
    expect(lockedFilter).toBeDefined();
    expect(unlockedFilter).toBeDefined();
  });

  describe('locked filter', () => {
    it('should only match lockable items that are locked', () => {
      const filterFunc = lockedFilter!.filter({});

      // Should match: lockable + locked
      expect(filterFunc(createMockItem(true, true) as DimItem)).toBe(true);

      // Should NOT match: lockable + not locked
      expect(filterFunc(createMockItem(true, false) as DimItem)).toBe(false);

      // Should NOT match: not lockable + locked
      expect(filterFunc(createMockItem(false, true) as DimItem)).toBe(false);

      // Should NOT match: not lockable + not locked
      expect(filterFunc(createMockItem(false, false) as DimItem)).toBe(false);
    });
  });

  describe('unlocked filter', () => {
    it('should only match lockable items that are unlocked', () => {
      const filterFunc = unlockedFilter!.filter({});

      // Should match: lockable + not locked
      expect(filterFunc(createMockItem(true, false) as DimItem)).toBe(true);

      // Should NOT match: lockable + locked
      expect(filterFunc(createMockItem(true, true) as DimItem)).toBe(false);

      // Should NOT match: not lockable + not locked
      expect(filterFunc(createMockItem(false, false) as DimItem)).toBe(false);

      // Should NOT match: not lockable + locked
      expect(filterFunc(createMockItem(false, true) as DimItem)).toBe(false);
    });
  });
});
