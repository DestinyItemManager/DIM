import {
  DestinyVendorsResponse,
  DestinyVendorComponent,
  DestinyItemComponentSetOfint32,
  DestinyVendorSaleItemComponent,
  DestinyCollectibleComponent,
  DestinyVendorDefinition,
  BungieMembershipType,
  DestinyDestinationDefinition,
  DestinyPlaceDefinition,
  DestinyVendorGroupDefinition,
  DestinyInventoryItemDefinition,
  DestinyCollectibleState,
} from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { VendorItem } from './vendor-item';
import _ from 'lodash';
import { DimItem } from 'app/inventory/item-types';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import { VENDORS } from 'app/search/d2-known-values';
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

const vendorOrder = [
  VENDORS.SPIDER,
  VENDORS.EVERVERSE,
  VENDORS.BENEDICT,
  VENDORS.BANSHEE,
  VENDORS.DRIFTER,
  VENDORS.ADA,
];

export function toVendorGroups(
  vendorsResponse: DestinyVendorsResponse,
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  account: DestinyAccount,
  mergedCollectibles?: {
    [hash: number]: DestinyCollectibleComponent;
  }
): D2VendorGroup[] {
  if (!vendorsResponse.vendorGroups.data) {
    return [];
  }

  return _.sortBy(
    Object.values(vendorsResponse.vendorGroups.data.groups).map((group) => {
      const groupDef = defs.VendorGroup.get(group.vendorGroupHash);
      return {
        def: groupDef,
        vendors: _.sortBy(
          _.compact(
            group.vendorHashes.map((vendorHash) =>
              toVendor(
                vendorHash,
                defs,
                buckets,
                vendorsResponse.vendors.data?.[vendorHash],
                account,
                vendorsResponse.itemComponents[vendorHash],
                vendorsResponse.sales.data?.[vendorHash]?.saleItems,
                mergedCollectibles
              )
            )
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
  vendorHash: number,
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  vendor: DestinyVendorComponent | undefined,
  account: DestinyAccount,
  itemComponents?: DestinyItemComponentSetOfint32,
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  },
  mergedCollectibles?: {
    [hash: number]: DestinyCollectibleComponent;
  }
): D2Vendor | undefined {
  const vendorDef = defs.Vendor.get(vendorHash);

  if (!vendorDef) {
    return undefined;
  }

  const vendorItems = getVendorItems(
    account,
    defs,
    buckets,
    vendorDef,
    itemComponents,
    sales,
    mergedCollectibles
  );
  if (!vendorItems.length) {
    return undefined;
  }

  const destinationDef = vendor?.vendorLocationIndex
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
      (i) => !i.itemCategoryHashes?.includes(ItemCategoryHashes.Shaders)
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

export function getVendorItems(
  account: DestinyAccount,
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  vendorDef: DestinyVendorDefinition,
  itemComponents?: DestinyItemComponentSetOfint32,
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  },
  mergedCollectibles?: {
    [hash: number]: DestinyCollectibleComponent;
  }
): VendorItem[] {
  if (sales) {
    const components = Object.values(sales);
    return components.map((component) =>
      VendorItem.forVendorSaleItem(
        defs,
        buckets,
        vendorDef,
        component,
        itemComponents,
        mergedCollectibles
      )
    );
  } else if (vendorDef.returnWithVendorRequest) {
    // If the sales should come from the server, don't show anything until we have them
    return [];
  } else {
    return vendorDef.itemList
      .filter(
        (i) =>
          !i.exclusivity ||
          i.exclusivity === BungieMembershipType.All ||
          i.exclusivity === account.originalPlatformType
      )
      .map((i) => VendorItem.forVendorDefinitionItem(defs, buckets, i, mergedCollectibles));
  }
}

export function filterVendorGroupsToUnacquired(vendorGroups: readonly D2VendorGroup[]) {
  return vendorGroups
    .map((group) => ({
      ...group,
      vendors: group.vendors
        .map((vendor) => ({
          ...vendor,
          items: vendor.items.filter(
            (item) =>
              item.item?.isDestiny2() &&
              item.item.collectibleState !== null &&
              item.item.collectibleState & DestinyCollectibleState.NotAcquired
          ),
        }))
        .filter((v) => v.items.length),
    }))
    .filter((g) => g.vendors.length);
}

export function filterVendorGroupsToSearch(
  vendorGroups: readonly D2VendorGroup[],
  searchQuery: string,
  filterItems: (item: DimItem) => boolean
) {
  return vendorGroups
    .map((group) => ({
      ...group,
      vendors: group.vendors
        .map((vendor) => ({
          ...vendor,
          items: vendor.def.displayProperties.name.toLowerCase().includes(searchQuery.toLowerCase())
            ? vendor.items
            : vendor.items.filter((i) => i.item && filterItems(i.item)),
        }))
        .filter((v) => v.items.length),
    }))
    .filter((g) => g.vendors.length);
}
