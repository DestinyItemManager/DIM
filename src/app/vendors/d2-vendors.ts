import { CreateItemContext } from 'app/inventory/store/d2-item-factory';
import { VENDORS } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
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

const vendorOrder = [VENDORS.SPIDER, VENDORS.ADA_TRANSMOG, VENDORS.BANSHEE, VENDORS.EVERVERSE];

export function toVendorGroups(
  context: CreateItemContext,
  vendorsResponse: DestinyVendorsResponse,
  characterId: string
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
          _.compact(
            group.vendorHashes
              .map((vendorHash) =>
                toVendor(
                  // Override the item components from the profile with this vendor's item components
                  { ...context, itemComponents: vendorsResponse.itemComponents[vendorHash] },
                  vendorHash,
                  vendorsResponse.vendors.data?.[vendorHash],
                  characterId,
                  vendorsResponse.sales.data?.[vendorHash]?.saleItems
                )
              )
              .filter((vendor) => vendor?.items.length)
          ),
          (v) => {
            const index = vendorOrder.indexOf(v.def.hash);
            return index >= 0 ? index : v.def.hash;
          }
        ),
      };
    }),
    (g) => g.def.order
  );
}

export function toVendor(
  context: CreateItemContext,
  vendorHash: number,
  vendor: DestinyVendorComponent | undefined,
  characterId: string,
  sales:
    | {
        [key: string]: DestinyVendorSaleItemComponent;
      }
    | undefined
): D2Vendor | undefined {
  const { defs } = context;
  const vendorDef = defs.Vendor.get(vendorHash);

  if (!vendorDef) {
    return undefined;
  }

  const vendorItems = getVendorItems(context, vendorDef, characterId, sales);

  const destinationDef =
    typeof vendor?.vendorLocationIndex === 'number' && vendor.vendorLocationIndex >= 0
      ? defs.Destination.get(vendorDef.locations[vendor.vendorLocationIndex].destinationHash)
      : undefined;
  const placeDef = destinationDef && defs.Place.get(destinationDef.placeHash);

  const vendorCurrencyHashes = new Set<number>();
  for (const item of vendorItems) {
    for (const cost of item.costs) {
      vendorCurrencyHashes.add(cost.itemHash);
    }
  }
  const currencies = _.compact(
    Array.from(vendorCurrencyHashes, (h) => defs.InventoryItem.get(h)).filter(
      (i) => !i?.itemCategoryHashes?.includes(ItemCategoryHashes.Shaders)
    )
  );

  return {
    component: vendor,
    def: vendorDef,
    destination: destinationDef,
    place: placeDef,
    items: vendorItems,
    currencies,
  };
}

function getVendorItems(
  context: CreateItemContext,
  vendorDef: DestinyVendorDefinition,
  characterId: string,
  sales:
    | {
        [key: string]: DestinyVendorSaleItemComponent;
      }
    | undefined
): VendorItem[] {
  if (sales) {
    const components = Object.values(sales);
    return components.map((component) =>
      vendorItemForSaleItem(context, vendorDef, component, characterId)
    );
  } else if (vendorDef.returnWithVendorRequest) {
    // If the sales should come from the server, don't show anything until we have them
    return [];
  } else {
    return vendorDef.itemList.map((i) => vendorItemForDefinitionItem(context, i, characterId));
  }
}

export function filterVendorGroupsToUnacquired(
  vendorGroups: readonly D2VendorGroup[],
  ownedItemHashes: Set<number>
) {
  return vendorGroups
    .map((group) => ({
      ...group,
      vendors: group.vendors
        .map((vendor) => ({
          ...vendor,
          items: vendor.items.filter(
            ({ item, collectibleState }) =>
              item &&
              (collectibleState !== undefined
                ? collectibleState & DestinyCollectibleState.NotAcquired
                : item.itemCategoryHashes.includes(ItemCategoryHashes.Mods_Mod) &&
                  !ownedItemHashes.has(item.hash))
          ),
        }))
        .filter((v) => v.items.length),
    }))
    .filter((g) => g.vendors.length);
}

export function filterVendorGroupsToSearch(
  vendorGroups: readonly D2VendorGroup[],
  searchQuery: string,
  filterItems: ItemFilter
) {
  return vendorGroups
    .map((group) => ({
      ...group,
      vendors: group.vendors
        .map((vendor) => ({
          ...vendor,
          items: vendor.def.displayProperties.name.toLowerCase().includes(searchQuery.toLowerCase())
            ? vendor.items
            : vendor.items.filter(({ item }) => item && filterItems(item)),
        }))
        .filter((v) => v.items.length),
    }))
    .filter((g) => g.vendors.length);
}
