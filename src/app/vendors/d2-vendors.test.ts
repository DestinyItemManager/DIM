import { getBuckets } from 'app/destiny2/d2-buckets';
import { VendorHashes } from 'app/search/d2-known-values';
import { getTestDefinitions, getTestProfile, getTestVendors } from 'testing/test-utils';
import { D2VendorGroup, toVendorGroups } from './d2-vendors';

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

  it('merges the split Eververse vendors in the real vendor data', async () => {
    const defs = await getTestDefinitions();
    const vendorsResponse = getTestVendors();

    // Guard against a future fixture that no longer has the split family to merge.
    const eververseVendorsWithSales = Object.keys(vendorsResponse.sales.data ?? {}).filter((key) =>
      defs.Vendor.get(Number(key))?.vendorIdentifier?.startsWith('EVERVERSE'),
    );
    expect(eververseVendorsWithSales.length).toBeGreaterThan(1);

    const vendorGroups = await getTestVendorGroups();
    const allVendors = vendorGroups.flatMap((g) => g.vendors);

    // The whole family collapses into just the canonical Eververse vendor.
    const eververseVendors = allVendors.filter((v) =>
      v.def.vendorIdentifier?.startsWith('EVERVERSE'),
    );
    expect(eververseVendors).toHaveLength(1);
    expect(eververseVendors[0].def.hash).toBe(VendorHashes.Eververse);

    // Sub-vendor categories were folded in, so there are more than the def alone has.
    const merged = eververseVendors[0];
    const canonicalCategoryCount = defs.Vendor.get(VendorHashes.Eververse).displayCategories.length;
    expect(merged.def.displayCategories.length).toBeGreaterThan(canonicalCategoryCount);
  });
});
