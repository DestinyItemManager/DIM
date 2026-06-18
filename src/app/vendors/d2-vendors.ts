import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import { VendorHashes, silverItemHash } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { compact, filterMap } from 'app/utils/collections';
import { chainComparator, compareBy, compareByIndex } from 'app/utils/comparators';
import {
  DestinyCollectibleState,
  DestinyDestinationDefinition,
  DestinyInventoryItemDefinition,
  DestinyPlaceDefinition,
  DestinyVendorComponent,
  DestinyVendorDefinition,
  DestinyVendorGroupDefinition,
  DestinyVendorSaleItemComponent,
  DestinyVendorsResponse,
} from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import specialVendorStrings from 'data/d2/special-vendors-strings.json';
import vendorIconOverrides from 'data/d2/vendor-image-overrides.json';
import { VendorItem, vendorItemForDefinitionItem, vendorItemForSaleItem } from './vendor-item';
export interface D2VendorGroup {
  def: DestinyVendorGroupDefinition;
  vendors: D2Vendor[];
}

export interface D2Vendor {
  component?: DestinyVendorComponent;
  def: DestinyVendorDefinition;
  destination?: DestinyDestinationDefinition;
  place?: DestinyPlaceDefinition;
  items: VendorItem[];
  currencies: DestinyInventoryItemDefinition[];
}

const vendorOrder = [VendorHashes.AdaTransmog, VendorHashes.Banshee, VendorHashes.Eververse];

/**
 * All of the split Eververse vendors share this `vendorIdentifier` prefix (e.g.
 * `EVERVERSE`, `EVERVERSE_BRIGHT_DUST_ROTATOR_*`, `EVERVERSE_SILVER_ROTATOR_*`).
 */
const eververseVendorIdentifierPrefix = 'EVERVERSE';

export function toVendorGroups(
  context: ItemCreationContext,
  vendorsResponse: DestinyVendorsResponse,
  characterId: string,
): D2VendorGroup[] {
  if (!vendorsResponse.vendorGroups.data) {
    return [];
  }

  const { defs } = context;

  // Build every vendor first (including empty ones) so the Eververse merge below
  // can stitch the split vendors back together before we drop empties.
  const groups = Object.values(vendorsResponse.vendorGroups.data.groups).map((group) => ({
    def: defs.VendorGroup.get(group.vendorGroupHash),
    vendors: filterMap(group.vendorHashes, (vendorHash) =>
      toVendor(
        // Override the item components from the profile with this vendor's item components
        { ...context, itemComponents: vendorsResponse.itemComponents?.[vendorHash] },
        vendorHash,
        vendorsResponse.vendors.data?.[vendorHash],
        characterId,
        vendorsResponse.sales.data?.[vendorHash]?.saleItems,
        vendorsResponse,
      ),
    ),
  }));

  mergeEververseVendors(groups);

  return filterMap(groups, (group) => {
    const vendors = group.vendors
      .filter((vendor) => vendor.items.length)
      .sort(compareByIndex(vendorOrder, (v) => v.def.hash));
    return vendors.length ? { def: group.def, vendors } : undefined;
  }).sort(compareBy((g) => g.def.order));
}

/**
 * As of the Monument of Triumph update, Bungie split the Eververse vendor (Tess
 * Everis) into ~25 separate vendor definitions - a main vendor plus Bright Dust
 * / Silver / Featured "rotator" sub-vendors. Merge them all back into the single
 * canonical Eververse vendor so all of Tess's wares (especially Bright Dust)
 * appear together, instead of as a bunch of separate, mostly-unnamed tiles. See
 * https://github.com/Bungie-net/api/issues/2069.
 *
 * Mutates `groups` in place.
 */
export function mergeEververseVendors(
  groups: { def: DestinyVendorGroupDefinition; vendors: D2Vendor[] }[],
) {
  const eververseVendors = groups.flatMap((group) =>
    group.vendors.filter((vendor) =>
      vendor.def.vendorIdentifier?.startsWith(eververseVendorIdentifierPrefix),
    ),
  );
  if (eververseVendors.length <= 1) {
    return;
  }

  const primary =
    eververseVendors.find((vendor) => vendor.def.hash === VendorHashes.Eververse) ??
    eververseVendors[0];
  const subVendors = eververseVendors.filter((vendor) => vendor !== primary);

  // Each sub-vendor's items reference its own def's displayCategories by index,
  // so append those categories and shift the merged-in items to match.
  const displayCategories = [...primary.def.displayCategories];
  const items = [...primary.items];
  const currenciesByHash = new Map(primary.currencies.map((c) => [c.hash, c]));

  for (const vendor of subVendors) {
    const categoryOffset = displayCategories.length;
    displayCategories.push(...vendor.def.displayCategories);
    for (const item of vendor.items) {
      items.push(
        item.displayCategoryIndex === undefined
          ? item
          : { ...item, displayCategoryIndex: item.displayCategoryIndex + categoryOffset },
      );
    }
    for (const currency of vendor.currencies) {
      currenciesByHash.set(currency.hash, currency);
    }
  }

  primary.def = { ...primary.def, displayCategories };
  primary.items = items;
  primary.currencies = [...currenciesByHash.values()];

  // Drop the now-merged sub-vendors from their groups.
  const mergedAway = new Set(subVendors);
  for (const group of groups) {
    group.vendors = group.vendors.filter((vendor) => !mergedAway.has(vendor));
  }
}

export function toVendor(
  context: ItemCreationContext,
  vendorHash: number,
  vendor: DestinyVendorComponent | undefined,
  characterId: string,
  sales:
    | {
        [key: string]: DestinyVendorSaleItemComponent;
      }
    | undefined,
  vendorsResponse: DestinyVendorsResponse | undefined,
): D2Vendor | undefined {
  const { defs } = context;
  let vendorDef = defs.Vendor.get(vendorHash);

  if (!vendorDef) {
    return undefined;
  }

  const vendorItems = getVendorItems(
    context,
    vendorDef,
    characterId,
    sales,
    vendor?.nextRefreshDate,
  );
  vendorItems.sort(
    chainComparator(
      compareBy(
        (item) =>
          item.originalCategoryIndex !== undefined &&
          vendorDef.originalCategories[item.originalCategoryIndex]?.sortValue,
      ),
      compareBy((item) => item.vendorItemIndex),
    ),
  );

  const destinationHash =
    typeof vendor?.vendorLocationIndex === 'number' && vendor.vendorLocationIndex >= 0
      ? // Unadvertised nullability: DestinyVendorDefinition.locations
        (vendorDef.locations?.[vendor.vendorLocationIndex]?.destinationHash ?? 0)
      : 0;
  const destinationDef = destinationHash ? defs.Destination.get(destinationHash) : undefined;
  const placeDef = destinationDef?.placeHash ? defs.Place.get(destinationDef.placeHash) : undefined;

  const vendorCurrencyHashes = new Set<number>();
  gatherVendorCurrencies(defs, vendorDef, vendorsResponse, sales, vendorCurrencyHashes);
  const currencies = compact(
    Array.from(vendorCurrencyHashes, (h) => defs.InventoryItem.get(h)).filter(
      (i) =>
        !i?.itemCategoryHashes?.includes(ItemCategoryHashes.Shaders) &&
        !i?.itemCategoryHashes?.includes(ItemCategoryHashes.ShipModsTransmatEffects),
    ),
  );
  currencies.sort(compareBy((i) => i.inventory?.tierType));

  const iconOverride = (vendorIconOverrides as Record<string, string>)[vendorDef.hash];

  if (iconOverride) {
    vendorDef = {
      ...vendorDef,
      displayProperties: {
        ...vendorDef.displayProperties,
        smallTransparentIcon: iconOverride,
      },
    };
  }

  return {
    component: vendor,
    def: vendorDef,
    destination: destinationDef,
    place: placeDef,
    items: vendorItems,
    currencies,
  };
}

/**
 * Recursively look at sub-vendors of the current `vendor` to find
 * all currency hashes needed to purchase the sales, and collect them in `vendorCurrencyHashes`.
 */
function gatherVendorCurrencies(
  defs: D2ManifestDefinitions,
  vendor: DestinyVendorDefinition,
  vendorsResponse: DestinyVendorsResponse | undefined,
  sales:
    | {
        [key: string]: DestinyVendorSaleItemComponent;
      }
    | undefined,
  vendorCurrencyHashes: Set<number>,
  // prevent infinite recursion just in case vendors have a cycle in their items' previewvendorHashes
  seenVendors = new Set<number>(),
) {
  for (const sale of sales
    ? Object.values(sales).flatMap((saleItem) => saleItem.costs)
    : vendor.itemList.flatMap((item) => item.currencies)) {
    vendorCurrencyHashes.add(sale.itemHash);
  }

  for (const item of vendor.itemList) {
    const itemDef = defs.InventoryItem.get(item.itemHash);
    if (!itemDef) {
      continue;
    }
    const subVendorHash = defs.InventoryItem.get(item.itemHash)?.preview?.previewVendorHash;
    if (subVendorHash && !seenVendors.has(subVendorHash)) {
      seenVendors.add(subVendorHash);
      const subVendor = defs.Vendor.get(subVendorHash);
      gatherVendorCurrencies(
        defs,
        subVendor,
        vendorsResponse,
        vendorsResponse?.sales.data?.[subVendorHash]?.saleItems,
        vendorCurrencyHashes,
        seenVendors,
      );
    }
  }
}

function getVendorItems(
  context: ItemCreationContext,
  vendorDef: DestinyVendorDefinition,
  characterId: string,
  sales:
    | {
        [key: string]: DestinyVendorSaleItemComponent;
      }
    | undefined,
  nextRefreshDate?: string,
): VendorItem[] {
  if (sales) {
    const components = Object.values(sales);
    return components.map((component) =>
      vendorItemForSaleItem(context, vendorDef, component, characterId, nextRefreshDate),
    );
  } else if (vendorDef.returnWithVendorRequest) {
    // If the sales should come from the server, don't show anything until we have them
    return [];
  } else {
    return vendorDef.itemList.map((i, index) =>
      vendorItemForDefinitionItem(context, i, characterId, index, nextRefreshDate),
    );
  }
}

export type VendorFilterFunction = (
  item: VendorItem,
  vendor: D2Vendor,
) => boolean | null | undefined;

export function filterVendorGroups(
  vendorGroups: readonly D2VendorGroup[],
  predicate: VendorFilterFunction,
) {
  return vendorGroups
    .map((group) => ({
      ...group,
      vendors: group.vendors
        .map((vendor) => ({
          ...vendor,
          items: vendor.items.filter((item) => predicate(item, vendor)),
        }))
        .filter((v) => v.items.length),
    }))
    .filter((g) => g.vendors.length);
}

export function filterToUnacquired(
  ownedItemHashes: Set<number>,
  defs: D2ManifestDefinitions | undefined,
): VendorFilterFunction {
  return ({ owned, item, collectibleState, failureStrings }) =>
    item &&
    !owned &&
    !failureStrings.includes(
      defs?.Vendor.get(specialVendorStrings.alreadyAcquiredFailureString.vendorHash)
        ?.failureStrings[specialVendorStrings.alreadyAcquiredFailureString.index] ||
        'FallbackToPreventBadFiltering',
    ) &&
    (collectibleState !== undefined
      ? (collectibleState & DestinyCollectibleState.NotAcquired) !== 0
      : (item.itemCategoryHashes.includes(ItemCategoryHashes.Mods_Mod) ||
          item.itemCategoryHashes.includes(ItemCategoryHashes.Shaders)) &&
        !ownedItemHashes.has(item.hash));
}

export function filterToNoSilver(): VendorFilterFunction {
  return ({ costs, displayCategoryIndex }, vendor) => {
    if (costs.some((c) => c.itemHash === silverItemHash && c.quantity > 0)) {
      return false;
    }
    const categoryIdentifier =
      displayCategoryIndex !== undefined &&
      displayCategoryIndex >= 0 &&
      vendor.def.displayCategories[displayCategoryIndex].identifier;
    return !(
      categoryIdentifier &&
      (categoryIdentifier.startsWith('categories.campaigns') ||
        categoryIdentifier.startsWith('categories.featured.carousel'))
    );
  };
}

export function filterToSearch(searchQuery: string, filterItems: ItemFilter): VendorFilterFunction {
  return ({ item }, vendor) =>
    vendor.def.displayProperties.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item && filterItems(item));
}
