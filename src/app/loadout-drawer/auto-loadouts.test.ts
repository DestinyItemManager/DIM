import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { maxLightItemSet } from './auto-loadouts';

let idCounter = 0;

/** A minimal mock item with just the fields maxLightItemSet / optimalItemSet touch. */
function mockItem(
  overrides: Partial<Omit<DimItem, 'bucket'>> & { bucket?: Record<string, unknown> } = {},
): DimItem {
  const { bucket: bucketOverrides, ...rest } = overrides;
  return {
    id: `item-${idCounter++}`,
    destinyVersion: 1,
    power: 300,
    equipment: true,
    classified: false,
    classType: DestinyClass.Titan,
    owner: 'char1',
    equipped: false,
    notransfer: false,
    equippingLabel: undefined,
    talentGrid: undefined,
    location: { inPostmaster: false },
    bucket: {
      hash: BucketHashes.Ghost,
      inWeapons: false,
      inArmor: false,
      sort: 'General',
      ...bucketOverrides,
    },
    ...rest,
  } as unknown as DimItem;
}

const d1Store = {
  id: 'char1',
  destinyVersion: 1,
  classType: DestinyClass.Titan,
  isVault: false,
} as unknown as DimStore;

describe('maxLightItemSet', () => {
  beforeEach(() => {
    idCounter = 0;
  });

  // Regression test for issue #11648: the D1 max-light loadout left out the
  // Ghost Shell (it contributes to D1 light but not D2 power).
  it('includes a D1 ghost shell', () => {
    const ghost = mockItem({ power: 320, bucket: { hash: BucketHashes.Ghost, sort: 'General' } });
    const { equippable } = maxLightItemSet([ghost], d1Store);
    expect(equippable.map((i) => i.id)).toContain(ghost.id);
  });
});
