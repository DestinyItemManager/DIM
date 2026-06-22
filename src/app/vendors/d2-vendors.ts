import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import { VendorHashes, silverItemHash } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { compact, filterMap } from 'app/utils/collections';
import { chainComparator, compareBy, compareByIndex } from 'app/utils/comparators';
import {
  DestinyCollectibleState,
  DestinyDestinationDefinition,
  DestinyDisplayCategoryDefinition,
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
import { maxBy } from 'es-toolkit';
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
  /**
   * The vendor's "help" item, if it has one. It describes the reputation track and
   * is pulled out of the regular sale items so it can be shown alongside the rep
   * track instead. Only set when the vendor actually has a rep track.
   */
  helpItem?: VendorItem;
}

const vendorOrder = [VendorHashes.AdaTransmog, VendorHashes.Banshee, VendorHashes.Eververse];

/**
 * All of the split Eververse vendors share this `vendorIdentifier` prefix (e.g.
 * `EVERVERSE`, `EVERVERSE_BRIGHT_DUST_ROTATOR_*`, `EVERVERSE_SILVER_ROTATOR_*`).
 */
const eververseVendorIdentifierPrefix = 'EVERVERSE';

/**
 * Some vendors contain a "help" item that isn't a real sale item, but instead
 * describes the vendor's reputation track. We pull it out of the regular sale
 * items and show it alongside the rep track instead.
 *
 * These items all use the shared "vendor_help" icon (icon def 13580639, foreground
 * `.../vendor_help...png`). The more semantic-looking `tooltipStyle: 'vendor_action'`
 * can't be used because DIM's manifest trimmer blanks `tooltipStyle` out.
 */
const HELP_ITEM_ICON_HASH = 13580639;

function isHelpVendorItem(vendorItem: VendorItem) {
  return vendorItem.displayProperties?.iconHash === HELP_ITEM_ICON_HASH;
}

export function toVendorGroups(
  context: ItemCreationContext,
  vendorsResponse: DestinyVendorsResponse,
  characterId: string,
): D2VendorGroup[] {
  if (!vendorsResponse.vendorGroups.data) {
    return [];
  }

  const { defs } = context;

  const buildVendor = (vendorHash: number) =>
    toVendor(
      // Override the item components from the profile with this vendor's item components
      { ...context, itemComponents: vendorsResponse.itemComponents?.[vendorHash] },
      vendorHash,
      vendorsResponse.vendors.data?.[vendorHash],
      characterId,
      vendorsResponse.sales.data?.[vendorHash]?.saleItems,
      vendorsResponse,
    );

  // Build every vendor first (including empty ones) so the Eververse merge below
  // can stitch the split vendors back together before we drop empties.
  const groups = Object.values(vendorsResponse.vendorGroups.data.groups).map((group) => ({
    def: defs.VendorGroup.get(group.vendorGroupHash),
    vendors: filterMap(group.vendorHashes, buildVendor),
  }));

  // The split Eververse "rotator" sub-vendors aren't part of any vendor group
  // (their definitions have no `groups`), so they never show up via the groups
  // above. Find any that came back with sales and build them so the merge can
  // fold them into Tess. See https://github.com/Bungie-net/api/issues/2069.
  const builtVendorHashes = new Set(groups.flatMap((g) => g.vendors.map((v) => v.def.hash)));
  const looseEververseVendors = filterMap(Object.keys(vendorsResponse.sales.data ?? {}), (key) => {
    const vendorHash = Number(key);
    if (builtVendorHashes.has(vendorHash)) {
      return undefined;
    }
    const vendorDef = defs.Vendor.get(vendorHash);
    return vendorDef?.vendorIdentifier?.startsWith(eververseVendorIdentifierPrefix)
      ? buildVendor(vendorHash)
      : undefined;
  });

  mergeVendors(
    groups,
    VendorHashes.Eververse,
    eververseVendorIdentifierPrefix,
    looseEververseVendors,
  );

  return filterMap(groups, (group) => {
    const vendors = group.vendors
      .filter((vendor) => vendor.items.length)
      .sort(compareByIndex(vendorOrder, (v) => v.def.hash));
    return vendors.length ? { def: group.def, vendors } : undefined;
  }).sort(compareBy((g) => g.def.order));
}

/**
 * Merge a family of related vendors - all sharing a `vendorIdentifier` prefix -
 * into a single primary vendor, folding their items, display categories, and
 * currencies together.
 *
 * The motivating case: as of the Monument of Triumph update, Bungie split the
 * Eververse vendor (Tess Everis) into ~25 separate vendor definitions - a main
 * vendor plus Bright Dust / Silver / Featured "rotator" sub-vendors. Merging
 * them back together makes all of Tess's wares (especially Bright Dust) appear
 * together, instead of as a bunch of separate, mostly-unnamed tiles. See
 * https://github.com/Bungie-net/api/issues/2069.
 *
 * Mutates `groups` in place.
 */
export function mergeVendors(
  groups: { def: DestinyVendorGroupDefinition; vendors: D2Vendor[] }[],
  /** The vendor that the others fold into; falls back to the first match if absent. */
  primaryVendorHash: number,
  /** Shared `vendorIdentifier` prefix that identifies the family to merge. */
  identifierPrefix: string,
  /** Family members that aren't part of any group (e.g. loose rotator sub-vendors). */
  looseVendors: D2Vendor[] = [],
) {
  const familyVendors = [
    ...groups.flatMap((group) =>
      group.vendors.filter((vendor) => vendor.def.vendorIdentifier?.startsWith(identifierPrefix)),
    ),
    ...looseVendors,
  ];
  if (familyVendors.length <= 1) {
    return;
  }

  const primary =
    familyVendors.find((vendor) => vendor.def.hash === primaryVendorHash) ?? familyVendors[0];
  const subVendors = familyVendors.filter((vendor) => vendor !== primary);

  // Each sub-vendor's items reference its own def's displayCategories by index.
  // Append those categories (collapsing ones that share a name, e.g. several
  // "Ghost Shell" rotators) and remap the merged-in items to the combined index.
  const displayCategories = [...primary.def.displayCategories];
  const items = [...primary.items];
  const currenciesByHash = new Map(primary.currencies.map((c) => [c.hash, c]));

  const categoryIndexByName = new Map<string, number>();
  for (const [index, category] of displayCategories.entries()) {
    const name = category.displayProperties?.name;
    if (name && !categoryIndexByName.has(name)) {
      categoryIndexByName.set(name, index);
    }
  }

  for (const vendor of subVendors) {
    // Map this vendor's category indices into the combined list, reusing an
    // existing same-named category where there is one.
    const localToCombined = new Map<number, number>();
    for (const [localIndex, category] of vendor.def.displayCategories.entries()) {
      const name = category.displayProperties?.name;
      const existing = name ? categoryIndexByName.get(name) : undefined;
      if (existing !== undefined) {
        localToCombined.set(localIndex, existing);
      } else {
        const combinedIndex = displayCategories.length;
        displayCategories.push(category);
        if (name) {
          categoryIndexByName.set(name, combinedIndex);
        }
        localToCombined.set(localIndex, combinedIndex);
      }
    }
    for (const item of vendor.items) {
      items.push(
        item.displayCategoryIndex === undefined
          ? item
          : {
              ...item,
              displayCategoryIndex:
                localToCombined.get(item.displayCategoryIndex) ?? item.displayCategoryIndex,
            },
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

/**
 * Replace the name of any unnamed display category with the most common item
 * type sold in it, so those categories render as e.g. "Shader" instead of
 * "Unknown". Returns the original array unchanged when every category is named.
 */
export function nameUnnamedCategories(
  displayCategories: DestinyDisplayCategoryDefinition[],
  items: VendorItem[],
): DestinyDisplayCategoryDefinition[] {
  if (displayCategories.every((category) => category.displayProperties?.name)) {
    return displayCategories;
  }
  const itemsByCategory = Map.groupBy(items, (item) => item.displayCategoryIndex);
  return displayCategories.map((category, index) =>
    category.displayProperties?.name
      ? category
      : nameCategoryFromItems(category, itemsByCategory.get(index)),
  );
}

/**
 * Give an unnamed display category a name based on the most common item type it
 * sells. Returns the original category unchanged if we can't tell.
 */
function nameCategoryFromItems(
  category: DestinyDisplayCategoryDefinition,
  items: VendorItem[] = [],
): DestinyDisplayCategoryDefinition {
  const typeNameCounts = new Map<string, number>();
  for (const { item } of items) {
    if (item?.typeName) {
      typeNameCounts.set(item.typeName, (typeNameCounts.get(item.typeName) ?? 0) + 1);
    }
  }
  if (typeNameCounts.size === 0) {
    return category;
  }
  const name = maxBy([...typeNameCounts], ([, count]) => count)![0];
  return { ...category, displayProperties: { ...category.displayProperties, name } };
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

  // Pull the "help" item out of the regular sale items so it isn't shown as a
  // normal tile. Surface it on the rep track (if there is one) instead.
  let helpItem: VendorItem | undefined;
  const helpIndex = vendorItems.findIndex(isHelpVendorItem);
  if (helpIndex >= 0) {
    const [extracted] = vendorItems.splice(helpIndex, 1);
    if (vendorDef.factionHash && vendor?.progression) {
      helpItem = extracted;
      if (helpItem.item) {
        // It's not a real item, so don't show its placeholder type ("Unknown") in the popup.
        helpItem.item.typeName = '';
      }
    }
  }

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

  // Name any unnamed display categories after the item type they sell, so they
  // don't render as "Unknown" (e.g. the split Eververse rotator sub-vendors,
  // whose categories come through blank).
  const namedCategories = nameUnnamedCategories(vendorDef.displayCategories, vendorItems);
  if (namedCategories !== vendorDef.displayCategories) {
    vendorDef = { ...vendorDef, displayCategories: namedCategories };
  }

  return {
    component: vendor,
    def: vendorDef,
    destination: destinationDef,
    place: placeDef,
    items: vendorItems,
    currencies,
    helpItem,
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
