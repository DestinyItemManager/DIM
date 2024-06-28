import { LimitedDestinyVendorsResponse } from 'app/bungie-api/destiny2-api';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import { VendorHashes, silverItemHash } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { filterMap } from 'app/utils/collections';
import { chainComparator, compareBy } from 'app/utils/comparators';
import {
  DestinyCollectibleState,
  DestinyDestinationDefinition,
  DestinyInventoryItemDefinition,
  DestinyPlaceDefinition,
  DestinyVendorComponent,
  DestinyVendorDefinition,
  DestinyVendorGroupDefinition,
  DestinyVendorSaleItemComponent,
} from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
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

export function toVendorGroups(
  context: ItemCreationContext,
  vendorsResponse: LimitedDestinyVendorsResponse,
  characterId: string,
): D2VendorGroup[] {
  if (!vendorsResponse.vendorGroups.data) {
    return [];
  }

  const { defs } = context;

  return _.sortBy(
    Object.values(vendorsResponse.vendorGroups.data.groups).map((group) => {
      const groupDef = defs.VendorGroup.get(group.vendorGroupHash);
      return {
        def: groupDef,
        vendors: _.sortBy(
          filterMap(group.vendorHashes, (vendorHash) => {
            const vendor = toVendor(
              // Override the item components from the profile with this vendor's item components
              { ...context, itemComponents: vendorsResponse.itemComponents?.[vendorHash] },
              vendorHash,
              vendorsResponse.vendors.data?.[vendorHash],
              characterId,
              vendorsResponse.sales.data?.[vendorHash]?.saleItems,
              vendorsResponse,
            );
            return vendor?.items.length ? vendor : undefined;
          }),
          (v) => {
            const index = vendorOrder.indexOf(v.def.hash);
            return index >= 0 ? index : v.def.hash;
          },
        ),
      };
    }),
    (g) => g.def.order,
  );
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
  vendorsResponse: LimitedDestinyVendorsResponse | undefined,
): D2Vendor | undefined {
  const { defs } = context;
  const vendorDef = defs.Vendor.get(vendorHash);

  if (!vendorDef) {
    return undefined;
  }

  const vendorItems = getVendorItems(context, vendorDef, characterId, sales);
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
      ? vendorDef.locations[vendor.vendorLocationIndex]?.destinationHash ?? 0
      : 0;
  const destinationDef = destinationHash ? defs.Destination.get(destinationHash) : undefined;
  const placeDef = destinationDef?.placeHash ? defs.Place.get(destinationDef.placeHash) : undefined;

  const vendorCurrencyHashes = new Set<number>();
  gatherVendorCurrencies(defs, vendorDef, vendorsResponse, sales, vendorCurrencyHashes);
  const currencies = _.compact(
    Array.from(vendorCurrencyHashes, (h) => defs.InventoryItem.get(h)).filter(
      (i) =>
        !i?.itemCategoryHashes?.includes(ItemCategoryHashes.Shaders) &&
        !i?.itemCategoryHashes?.includes(ItemCategoryHashes.ShipModsTransmatEffects),
    ),
  );
  currencies.sort(compareBy((i) => i.inventory?.tierType));

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
  vendorsResponse: LimitedDestinyVendorsResponse | undefined,
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
): VendorItem[] {
  if (sales) {
    const components = Object.values(sales);
    return components.map((component) =>
      vendorItemForSaleItem(context, vendorDef, component, characterId),
    );
  } else if (vendorDef.returnWithVendorRequest) {
    // If the sales should come from the server, don't show anything until we have them
    return [];
  } else {
    return vendorDef.itemList.map((i, index) =>
      vendorItemForDefinitionItem(context, i, characterId, index),
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

export function filterToUnacquired(ownedItemHashes: Set<number>): VendorFilterFunction {
  return ({ owned, item, collectibleState }) =>
    item &&
    !owned &&
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
