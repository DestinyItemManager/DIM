import { DestinyTrackerServiceType } from "../item-review/destiny-tracker.service";
import { DestinyVendorsResponse, DestinyVendorSaleItemComponent, DestinyVendorResponse, DestinyProfileResponse, DestinyVendorItemDefinition } from "bungie-api-ts/destiny2";
import * as _ from "underscore";
import { D2ManifestDefinitions } from "../destiny2/d2-definitions.service";

function isWeaponOrArmor(defs: D2ManifestDefinitions,
                         saleItemComponent: DestinyVendorSaleItemComponent | DestinyVendorItemDefinition): boolean {
  const inventoryItemStats = defs.InventoryItem.get(saleItemComponent.itemHash).stats;
  return (inventoryItemStats &&
          ((inventoryItemStats.primaryBaseStatHash === 1480404414) || // weapon
          (inventoryItemStats.primaryBaseStatHash === 3897883278))); // armor
}

export async function fetchRatings(defs: D2ManifestDefinitions,
                                   destinyTrackerService: DestinyTrackerServiceType,
                                   vendorsResponse?: DestinyVendorsResponse,
                                   vendorResponse?: DestinyVendorResponse,
                                   profileResponse?: DestinyProfileResponse): Promise<void> {
  if (vendorsResponse) {
    const saleComponentArray = Object.values(vendorsResponse.sales.data)
      .map((saleItemComponent) => saleItemComponent.saleItems);

    const saleComponents = ([] as DestinyVendorSaleItemComponent[]).concat(...saleComponentArray.map((v) => Object.values(v)))
      .filter((sc) => isWeaponOrArmor(defs, sc));

    await destinyTrackerService.bulkFetchVendorItems(saleComponents);
  } else if (vendorResponse) {
    const saleComponents = Object.values(vendorResponse.sales.data)
      .filter((sc) => isWeaponOrArmor(defs, sc));

    await destinyTrackerService.bulkFetchVendorItems(saleComponents);
  } else if (profileResponse && defs) {
    const vendorItems: DestinyVendorItemDefinition[] = [];

    const kioskVendorHashes = new Set(Object.keys(profileResponse.profileKiosks.data.kioskItems));
    _.each(profileResponse.characterKiosks.data, (kiosk) => {
      _.each(kiosk.kioskItems, (_, kioskHash) => {
        kioskVendorHashes.add(kioskHash);
      });
    });

    Array.from(kioskVendorHashes).map((kvh) => {
      const vendorHash = Number(kvh);
      const kioskItems = profileResponse.profileKiosks.data.kioskItems[vendorHash].concat(_.flatten(Object.values(profileResponse.characterKiosks.data).map((d) => Object.values(d.kioskItems))));
      const vendorDef = defs.Vendor.get(vendorHash);
      vendorItems.push(...kioskItems.map((ki) => vendorDef.itemList[ki.index]).filter((vid) => isWeaponOrArmor(defs, vid)));
    });

    await destinyTrackerService.bulkFetchVendorItems(undefined, vendorItems);
  } else {
    throw new Error("No response was supplied.");
  }
}
