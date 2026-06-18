import { getBuckets } from 'app/destiny2/d2-buckets';
import { VendorHashes } from 'app/search/d2-known-values';
import { getTestDefinitions, getTestProfile, getTestVendors } from 'testing/test-utils';
import { D2Vendor, D2VendorGroup, mergeEververseVendors, toVendorGroups } from './d2-vendors';

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
}

function mockVendor(
  hash: number,
  vendorIdentifier: string,
  categories: string[],
  items: MockItem[],
  currencyHashes: number[] = [],
): D2Vendor {
  return {
    def: {
      hash,
      vendorIdentifier,
      displayCategories: categories.map((identifier) => ({ identifier })),
    },
    items,
    currencies: currencyHashes.map((h) => ({ hash: h })),
  } as unknown as D2Vendor;
}

const itemsOf = (vendor: D2Vendor) => vendor.items as unknown as MockItem[];
const catId = (vendor: D2Vendor, i: number) =>
  (vendor.def.displayCategories[i] as { identifier: string }).identifier;
const group = (vendors: D2Vendor[]) => ({ def: { order: 0 } as never, vendors });

// Bungie split Eververse into ~25 separate vendors (Bungie-net/api#2069); these
// cover stitching them back into the single canonical Eververse vendor.
describe('mergeEververseVendors', () => {
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
    mergeEververseVendors(groups);

    // Only the primary Eververse and the unrelated vendor remain.
    expect(groups[0].vendors).toEqual([primary, unrelated]);

    // All items folded into the primary, with category indices shifted per vendor.
    const items = itemsOf(primary);
    expect(items.map((i) => i.mark)).toEqual(['p0', 'r1', 'r2a', 'r2b']);
    expect(items.find((i) => i.mark === 'r1')!.displayCategoryIndex).toBe(1);
    expect(items.find((i) => i.mark === 'r2a')!.displayCategoryIndex).toBe(2);
    expect(items.find((i) => i.mark === 'r2b')!.displayCategoryIndex).toBe(3);

    // Categories appended in order, so the shifted indices line up.
    expect(primary.def.displayCategories).toHaveLength(4);
    expect(catId(primary, 1)).toBe('cat-r1');
    expect(catId(primary, 3)).toBe('cat-r2b');

    // Currencies merged and de-duped by hash.
    expect(primary.currencies.map((c) => c.hash).sort()).toEqual([100, 200, 300]);
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
    mergeEververseVendors(groups);

    expect(groups[1].vendors).toHaveLength(0);
    expect(itemsOf(primary).map((i) => i.mark)).toEqual(['p', 'r']);
  });

  it('does nothing when there is only one Eververse vendor', () => {
    const primary = mockVendor(
      VendorHashes.Eververse,
      'EVERVERSE',
      ['cat-p'],
      [{ mark: 'p', displayCategoryIndex: 0 }],
    );
    const groups = [group([primary])];
    mergeEververseVendors(groups);

    expect(groups[0].vendors).toEqual([primary]);
    expect(itemsOf(primary)).toHaveLength(1);
    expect(primary.def.displayCategories).toHaveLength(1);
  });
});
