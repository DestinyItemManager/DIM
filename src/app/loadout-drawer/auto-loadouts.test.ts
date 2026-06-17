import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { D1BucketHashes } from 'app/search/d1-known-values';
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

const d2Store = {
  id: 'char1',
  destinyVersion: 2,
  classType: DestinyClass.Titan,
  isVault: false,
} as unknown as DimStore;

describe('maxLightItemSet', () => {
  beforeEach(() => {
    idCounter = 0;
  });

  // Issue #11648: the D1 max-light loadout left out the Ghost Shell.
  it('includes a D1 ghost shell', () => {
    const ghost = mockItem({ power: 320, bucket: { hash: BucketHashes.Ghost, sort: 'General' } });
    const { equippable } = maxLightItemSet([ghost], d1Store);
    expect(equippable.map((i) => i.id)).toContain(ghost.id);
  });

  it('includes a D1 artifact', () => {
    const artifact = mockItem({
      power: 320,
      bucket: { hash: D1BucketHashes.Artifact, sort: 'General' },
    });
    const { equippable } = maxLightItemSet([artifact], d1Store);
    expect(equippable.some((i) => i.bucket.hash === D1BucketHashes.Artifact)).toBe(true);
  });

  it('picks the highest-light D1 ghost', () => {
    const lowGhost = mockItem({
      power: 300,
      bucket: { hash: BucketHashes.Ghost, sort: 'General' },
    });
    const highGhost = mockItem({
      power: 330,
      bucket: { hash: BucketHashes.Ghost, sort: 'General' },
    });
    const { equippable } = maxLightItemSet([lowGhost, highGhost], d1Store);
    const ghost = equippable.find((i) => i.bucket.hash === BucketHashes.Ghost);
    expect(ghost?.id).toBe(highGhost.id);
  });

  it('does not include ghosts for a D2 store (D2 power ignores them)', () => {
    const ghost = mockItem({
      destinyVersion: 2,
      power: 1800,
      bucket: { hash: BucketHashes.Ghost, sort: 'General' },
    });
    const { equippable } = maxLightItemSet([ghost], d2Store);
    expect(equippable.some((i) => i.bucket.hash === BucketHashes.Ghost)).toBe(false);
  });
});
