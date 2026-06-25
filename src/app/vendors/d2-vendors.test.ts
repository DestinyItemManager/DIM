import { getBuckets } from 'app/destiny2/d2-buckets';
import { VendorHashes } from 'app/search/d2-known-values';
import { getTestDefinitions, getTestProfile, getTestVendors } from 'testing/test-utils';
import {
  D2Vendor,
  D2VendorGroup,
  mergeVendors,
  nameUnnamedCategories,
  toVendorGroups,
} from './d2-vendors';

async function getTestVendorGroups() {
  const defs = await getTestDefinitions();
  const profileResponse = getTestProfile();
  const vendorsResponse = getTestVendors();
  const buckets = getBuckets(defs);
  const characterId = Object.keys(profileResponse.characters.data!)[0];

  return toVendorGroups(
    {
      defs,
      buckets,
      profileResponse,
      customStats: [],
    },
    vendorsResponse,
    characterId,
  );
}

function* allSaleItems(vendorGroups: D2VendorGroup[]) {
  for (const vendorGroup of vendorGroups) {
    for (const vendor of vendorGroup.vendors) {
      for (const saleItem of vendor.items) {
        yield saleItem;
      }
    }
  }
}

describe('process vendors', () => {
  it('can process vendors without errors', async () => {
    const vendorGroups = await getTestVendorGroups();

    // Check that there are any vendors
    expect(vendorGroups.length).toBeGreaterThan(0);

    // Check that there's any item that has pattern unlock info - there should be some!
    let vendorItemPatternFound = false;
    for (const saleItem of allSaleItems(vendorGroups)) {
      if (saleItem.item?.patternUnlockRecord) {
        vendorItemPatternFound = true;
        break;
      }
    }
    expect(vendorItemPatternFound).toBe(true);
  });
});

interface MockItem {
  mark: string;
  displayCategoryIndex?: number;
  /** Becomes the VendorItem's item.typeName, used to name unnamed categories. */
  typeName?: string;
}

function mockVendor(
  hash: number,
  vendorIdentifier: string,
  categories: { identifier?: string; name?: string }[] | string[],
  items: MockItem[],
  currencyHashes: number[] = [],
): D2Vendor {
  return {
    def: {
      hash,
      vendorIdentifier,
      displayCategories: categories.map((c) =>
        typeof c === 'string'
          ? { identifier: c }
          : { identifier: c.identifier, displayProperties: { name: c.name } },
      ),
    },
    items: items.map((i) => ({ ...i, item: i.typeName ? { typeName: i.typeName } : undefined })),
    currencies: currencyHashes.map((h) => ({ hash: h })),
  } as unknown as D2Vendor;
}

const itemsOf = (vendor: D2Vendor) => vendor.items as unknown as MockItem[];
const catId = (vendor: D2Vendor, i: number) =>
  (vendor.def.displayCategories[i] as { identifier: string }).identifier;
const catName = (vendor: D2Vendor, i: number) =>
  (vendor.def.displayCategories[i] as { displayProperties?: { name?: string } }).displayProperties
    ?.name;
const group = (vendors: D2Vendor[]) => ({ def: { order: 0 } as never, vendors });

const categoryName = (category: unknown) =>
  (category as { displayProperties?: { name?: string } }).displayProperties?.name;

describe('nameUnnamedCategories', () => {
  it('names an unnamed category after the most common item type it sells', () => {
    const vendor = mockVendor(
      123,
      'SOME_VENDOR',
      [
        { identifier: 'named', name: 'Featured' },
        { identifier: 'blank', name: '' },
      ],
      [
        { mark: 'f', displayCategoryIndex: 0, typeName: 'Emote' },
        { mark: 's1', displayCategoryIndex: 1, typeName: 'Shader' },
        { mark: 's2', displayCategoryIndex: 1, typeName: 'Shader' },
        { mark: 'e', displayCategoryIndex: 1, typeName: 'Emblem' },
      ],
    );
    const result = nameUnnamedCategories(vendor.def.displayCategories, vendor.items);

    // The already-named category is untouched; the blank one is named after its
    // most common item type.
    expect(categoryName(result[0])).toBe('Featured');
    expect(categoryName(result[1])).toBe('Shader');
  });
});

// Bungie split Eververse into ~25 separate vendors (Bungie-net/api#2069); these
// cover stitching them back into the single canonical Eververse vendor. We mock
// the vendors here because the captured vendor fixture predates the split (only
// the main EVERVERSE vendor has sales in it, none of the rotator sub-vendors),
// so it can't exercise the merge on its own.
const mergeEververse = (groups: ReturnType<typeof group>[], loose?: D2Vendor[]) =>
  mergeVendors(groups, VendorHashes.Eververse, 'EVERVERSE', loose);

// mergeVendors produces a new merged vendor object (rather than mutating the
// primary, which may be a reused cached build result) and swaps it into the
// groups. Find it by the canonical Eververse hash.
const findMerged = (groups: ReturnType<typeof group>[]) =>
  groups.flatMap((g) => g.vendors).find((v) => v.def.hash === VendorHashes.Eververse)!;

describe('mergeVendors', () => {
  it('merges all EVERVERSE* sub-vendors into the canonical Eververse vendor', () => {
    const primary = mockVendor(
      VendorHashes.Eververse,
      'EVERVERSE',
      ['cat-p'],
      [{ mark: 'p0', displayCategoryIndex: 0 }],
      [100],
    );
    const rotator1 = mockVendor(
      2031393824,
      'EVERVERSE_BRIGHT_DUST_ROTATOR_ARMOR',
      ['cat-r1'],
      [{ mark: 'r1', displayCategoryIndex: 0 }],
      [100, 200],
    );
    const rotator2 = mockVendor(
      2168194999,
      'EVERVERSE_BRIGHT_DUST_ROTATOR_WEAPON',
      ['cat-r2a', 'cat-r2b'],
      [
        { mark: 'r2a', displayCategoryIndex: 0 },
        { mark: 'r2b', displayCategoryIndex: 1 },
      ],
      [300],
    );
    const unrelated = mockVendor(
      999,
      'BANSHEE',
      ['cat-b'],
      [{ mark: 'b', displayCategoryIndex: 0 }],
    );

    const groups = [group([primary, rotator1, rotator2, unrelated])];
    mergeEververse(groups);

    // Only the merged Eververse and the unrelated vendor remain. The original
    // primary is left untouched (it may be a shared cached object).
    const merged = findMerged(groups);
    expect(groups[0].vendors).toEqual([merged, unrelated]);
    expect(itemsOf(primary)).toHaveLength(1);

    // All items folded into the merged vendor, with category indices shifted per vendor.
    const items = itemsOf(merged);
    expect(items.map((i) => i.mark)).toEqual(['p0', 'r1', 'r2a', 'r2b']);
    expect(items.find((i) => i.mark === 'r1')!.displayCategoryIndex).toBe(1);
    expect(items.find((i) => i.mark === 'r2a')!.displayCategoryIndex).toBe(2);
    expect(items.find((i) => i.mark === 'r2b')!.displayCategoryIndex).toBe(3);

    // Categories appended in order, so the shifted indices line up.
    expect(merged.def.displayCategories).toHaveLength(4);
    expect(catId(merged, 1)).toBe('cat-r1');
    expect(catId(merged, 3)).toBe('cat-r2b');

    // Currencies merged and de-duped by hash.
    expect(merged.currencies.map((c) => c.hash).sort()).toEqual([100, 200, 300]);
  });

  it('collapses merged categories that share a name', () => {
    const primary = mockVendor(
      VendorHashes.Eververse,
      'EVERVERSE',
      [{ identifier: 'p', name: 'Featured' }],
      [{ mark: 'p', displayCategoryIndex: 0 }],
    );
    // Two rotators that both sell ghosts - their categories share a name.
    const ghosts1 = mockVendor(
      3702989297,
      'EVERVERSE_BRIGHT_DUST_ROTATOR_GHOSTS',
      [{ identifier: 'g1', name: 'Ghost Shell' }],
      [{ mark: 'g1', displayCategoryIndex: 0 }],
    );
    const ghosts2 = mockVendor(
      3358239265,
      'EVERVERSE_SILVER_ROTATOR_GHOSTS',
      [{ identifier: 'g2', name: 'Ghost Shell' }],
      [{ mark: 'g2', displayCategoryIndex: 0 }],
    );

    const groups = [group([primary])];
    mergeEververse(groups, [ghosts1, ghosts2]);

    // Featured + a single combined "Ghost Shell" category, not two.
    const merged = findMerged(groups);
    expect(merged.def.displayCategories).toHaveLength(2);
    expect(catName(merged, 0)).toBe('Featured');
    expect(catName(merged, 1)).toBe('Ghost Shell');
    // Both rotators' items live under that one Ghost Shell category.
    expect(
      itemsOf(merged)
        .filter((i) => i.displayCategoryIndex === 1)
        .map((i) => i.mark),
    ).toEqual(['g1', 'g2']);
  });

  it('folds in loose Eververse vendors that are not part of any group', () => {
    // The rotator sub-vendors have no `groups`, so they arrive via sales.data
    // rather than a vendor group - they're passed in as the loose list.
    const primary = mockVendor(
      VendorHashes.Eververse,
      'EVERVERSE',
      ['cat-p'],
      [{ mark: 'p', displayCategoryIndex: 0 }],
    );
    const looseRotator = mockVendor(
      2031393824,
      'EVERVERSE_BRIGHT_DUST_ROTATOR_ARMOR',
      ['cat-r'],
      [{ mark: 'r', displayCategoryIndex: 0 }],
    );

    const groups = [group([primary])];
    mergeEververse(groups, [looseRotator]);

    // The loose rotator was never in a group; its items fold into Tess.
    const merged = findMerged(groups);
    expect(groups[0].vendors).toEqual([merged]);
    expect(itemsOf(merged).map((i) => i.mark)).toEqual(['p', 'r']);
    expect(itemsOf(merged).find((i) => i.mark === 'r')!.displayCategoryIndex).toBe(1);
    expect(merged.def.displayCategories).toHaveLength(2);
  });

  it('merges sub-vendors even when they live in a different group', () => {
    const primary = mockVendor(
      VendorHashes.Eververse,
      'EVERVERSE',
      ['cat-p'],
      [{ mark: 'p', displayCategoryIndex: 0 }],
    );
    const rotator = mockVendor(
      2041776156,
      'EVERVERSE_BRIGHT_DUST_ROTATOR_SHADERS',
      ['cat-r'],
      [{ mark: 'r', displayCategoryIndex: 0 }],
    );

    const groups = [group([primary]), group([rotator])];
    mergeEververse(groups);

    expect(groups[1].vendors).toHaveLength(0);
    expect(itemsOf(findMerged(groups)).map((i) => i.mark)).toEqual(['p', 'r']);
  });

  it('does nothing when there is only one Eververse vendor', () => {
    const primary = mockVendor(
      VendorHashes.Eververse,
      'EVERVERSE',
      ['cat-p'],
      [{ mark: 'p', displayCategoryIndex: 0 }],
    );
    const groups = [group([primary])];
    mergeEververse(groups);

    expect(groups[0].vendors).toEqual([primary]);
    expect(itemsOf(primary)).toHaveLength(1);
    expect(primary.def.displayCategories).toHaveLength(1);
  });
});
