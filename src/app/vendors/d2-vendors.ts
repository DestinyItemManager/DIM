import { DestinyAccount } from 'app/accounts/destiny-account';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { VENDORS } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import {
  BungieMembershipType,
  DestinyCollectibleComponent,
  DestinyCollectibleState,
  DestinyDestinationDefinition,
  DestinyInventoryItemDefinition,
  DestinyItemComponentSetOfint32,
  DestinyPlaceDefinition,
  DestinyProfileResponse,
  DestinyVendorComponent,
  DestinyVendorDefinition,
  DestinyVendorGroupDefinition,
  DestinyVendorSaleItemComponent,
  DestinyVendorsResponse,
} from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { VendorItem } from './vendor-item';
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
  vendorsResponse: DestinyVendorsResponse,
  profileResponse: DestinyProfileResponse,
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  account: DestinyAccount,
  characterId: string,
  mergedCollectibles:
    | {
        [hash: number]: DestinyCollectibleComponent;
      }
    | undefined
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
            group.vendorHashes
              .map((vendorHash) =>
                toVendor(
                  vendorHash,
                  defs,
                  buckets,
                  profileResponse,
                  vendorsResponse.vendors.data?.[vendorHash],
                  account,
                  characterId,
                  vendorsResponse.itemComponents[vendorHash],
                  vendorsResponse.sales.data?.[vendorHash]?.saleItems,
                  mergedCollectibles
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
  vendorHash: number,
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  profileResponse: DestinyProfileResponse | undefined,
  vendor: DestinyVendorComponent | undefined,
  account: DestinyAccount,
  characterId: string,
  itemComponents: DestinyItemComponentSetOfint32 | undefined,
  sales:
    | {
        [key: string]: DestinyVendorSaleItemComponent;
      }
    | undefined,
  mergedCollectibles:
    | {
        [hash: number]: DestinyCollectibleComponent;
      }
    | undefined
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
    profileResponse,
    characterId,
    itemComponents,
    sales,
    mergedCollectibles
  );

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

function getVendorItems(
  account: DestinyAccount,
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  vendorDef: DestinyVendorDefinition,
  profileResponse: DestinyProfileResponse | undefined,
  characterId: string,
  itemComponents: DestinyItemComponentSetOfint32 | undefined,
  sales:
    | {
        [key: string]: DestinyVendorSaleItemComponent;
      }
    | undefined,
  mergedCollectibles:
    | {
        [hash: number]: DestinyCollectibleComponent;
      }
    | undefined
): VendorItem[] {
  if (sales) {
    const components = Object.values(sales);
    return components.map((component) =>
      VendorItem.forVendorSaleItem(
        defs,
        buckets,
        vendorDef,
        profileResponse,
        component,
        characterId,
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
            (item) =>
              item.item &&
              (item.item.collectibleState !== undefined
                ? item.item.collectibleState & DestinyCollectibleState.NotAcquired
                : item.item.itemCategoryHashes.includes(ItemCategoryHashes.Mods_Mod) &&
                  !ownedItemHashes.has(item.item.hash))
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
            : vendor.items.filter((i) => i.item && filterItems(i.item)),
        }))
        .filter((v) => v.items.length),
    }))
    .filter((g) => g.vendors.length);
}
