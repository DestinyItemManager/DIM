import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getTestStores } from 'testing/test-utils';
import { formatWeaponRollForExport } from './weapon-roll-export';

describe('formatWeaponRollForExport', () => {
  let stores: DimStore[];

  beforeAll(async () => {
    stores = await getTestStores();
    expect(stores).toBeDefined();
  });

  /** Get a test item from the stores based on a predicate */
  function getTestItem(itemPredicate: (item: DimItem) => boolean): DimItem {
    const item = stores.flatMap((s) => s.items).find(itemPredicate);
    expect(item).toBeDefined();
    return item!;
  }

  it('should return empty string for non-weapon items', () => {
    const armor = getTestItem((i) => Boolean(i.bucket.inArmor));
    const result = formatWeaponRollForExport(armor);
    expect(result).toBe('');
  });

  it('should format a weapon roll correctly', () => {
    const weapon = getTestItem((i) => Boolean(i.bucket.inWeapons && i.sockets));
    expect(weapon).toBeDefined();

    const result = formatWeaponRollForExport(weapon);
    expect(result).toMatchSnapshot();
  });

  it('should include masterwork stat when available', () => {
    const weapon = getTestItem((i) =>
      Boolean(i.bucket.inWeapons && i.masterworkInfo?.stats?.length),
    );
    expect(weapon).toBeDefined();
    expect(weapon.masterworkInfo?.stats?.length).toBeGreaterThan(0);

    const result = formatWeaponRollForExport(weapon);
    expect(result).toMatchSnapshot();
  });
});
