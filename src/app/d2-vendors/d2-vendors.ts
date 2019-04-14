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
  DestinyCollectibleState
} from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DestinyAccount } from 'app/accounts/destiny-account.service';
import { VendorItem } from './vendor-item';
import _ from 'lodash';

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

export function toVendorGroups(
  vendorsResponse: DestinyVendorsResponse,
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  account: DestinyAccount,
  mergedCollectibles?: {
    [hash: number]: DestinyCollectibleComponent;
  }
): D2VendorGroup[] {
  return _.sortBy(
    Object.values(vendorsResponse.vendorGroups.data.groups).map((group) => {
      const groupDef = defs.VendorGroup.get(group.vendorGroupHash);
      return {
        def: groupDef,
        vendors: _.compact(
          group.vendorHashes.map((vendorHash) =>
            toVendor(
              vendorHash,
              defs,
              buckets,
              vendorsResponse.vendors.data[vendorHash],
              account,
              vendorsResponse.itemComponents[vendorHash],
              vendorsResponse.sales.data[vendorHash] &&
                vendorsResponse.sales.data[vendorHash].saleItems,
              mergedCollectibles
            )
          )
        )
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

  const destinationDef =
    vendor && defs.Destination.get(vendorDef.locations[vendor.vendorLocationIndex].destinationHash);
  const placeDef = destinationDef && defs.Place.get(destinationDef.placeHash);

  const vendorCurrencyHashes = new Set<number>();
  for (const item of vendorItems) {
    for (const cost of item.costs) {
      vendorCurrencyHashes.add(cost.itemHash);
    }
  }
  const currencies = _.compact(
    Array.from(vendorCurrencyHashes)
      .map((h) => defs.InventoryItem.get(h))
      .filter((i) => !i.itemCategoryHashes.includes(41))
  );

  return {
    component: vendor,
    def: vendorDef,
    destination: destinationDef,
    place: placeDef,
    items: vendorItems,
    currencies
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
  if (sales && itemComponents) {
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
          i.exclusivity === account.platformType
      )
      .map((i) => VendorItem.forVendorDefinitionItem(defs, buckets, i, mergedCollectibles));
  }
}

export function filterVendorGroupsToUnacquired(vendorGroups: readonly D2VendorGroup[]) {
  return vendorGroups
    .map((group) => {
      return {
        ...group,
        vendors: group.vendors
          .map((vendor) => {
            return {
              ...vendor,
              items: vendor.items.filter((item) => {
                return (
                  item.item &&
                  item.item.equipment &&
                  item.item.collectibleState !== null &&
                  item.item.collectibleState & DestinyCollectibleState.NotAcquired
                );
              })
            };
          })
          .filter((v) => v.items.length)
      };
    })
    .filter((g) => g.vendors.length);
}
