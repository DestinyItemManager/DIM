import { DestinyTrackerService, dimDestinyTrackerService } from "../item-review/destiny-tracker.service";
import { DestinyVendorsResponse, DestinyVendorSaleItemComponent, DestinyVendorResponse, DestinyProfileResponse, DestinyVendorItemDefinition, DestinyVendorDefinition } from "bungie-api-ts/destiny2";
import * as _ from "underscore";
import { D2ManifestDefinitions } from "../destiny2/d2-definitions.service";
import { flatMap } from "../util";

function isWeaponOrArmor(
  defs: D2ManifestDefinitions,
  saleItemComponent: DestinyVendorSaleItemComponent | DestinyVendorItemDefinition
): boolean {
  const inventoryItemStats = defs.InventoryItem.get(saleItemComponent.itemHash).stats;
  return inventoryItemStats &&
          (inventoryItemStats.primaryBaseStatHash === 1480404414 || // weapon
           inventoryItemStats.primaryBaseStatHash === 3897883278); // armor
}

export async function fetchRatingsForVendors(
  defs: D2ManifestDefinitions,
  vendorsResponse: DestinyVendorsResponse
): Promise<DestinyTrackerService> {
  const saleComponentArray = Object.values(vendorsResponse.sales.data)
    .map((saleItemComponent) => saleItemComponent.saleItems);

  const saleComponents = flatMap(saleComponentArray, (v) => Object.values(v))
    .filter((sc) => isWeaponOrArmor(defs, sc));

  return dimDestinyTrackerService.bulkFetchVendorItems(saleComponents);
}

export async function fetchRatingsForVendor(
  defs: D2ManifestDefinitions,
  vendorResponse: DestinyVendorResponse
): Promise<DestinyTrackerService> {
  const saleComponents = Object.values(vendorResponse.sales.data)
    .filter((sc) => isWeaponOrArmor(defs, sc));

  return dimDestinyTrackerService.bulkFetchVendorItems(saleComponents);
}

export async function fetchRatingsForKiosks(
  defs: D2ManifestDefinitions,
  profileResponse: DestinyProfileResponse
): Promise<DestinyTrackerService> {
  const kioskVendorHashes = new Set(Object.keys(profileResponse.profileKiosks.data.kioskItems));
  _.each(profileResponse.characterKiosks.data, (kiosk) => {
    _.each(kiosk.kioskItems, (_, kioskHash) => {
      kioskVendorHashes.add(kioskHash);
    });
  });

  const vendorItems = flatMap(Array.from(kioskVendorHashes), (kvh) => {
    const vendorHash = Number(kvh);
    const vendorDef = defs.Vendor.get(vendorHash);
    return vendorDef.itemList.filter((vid) => isWeaponOrArmor(defs, vid));
  });

  return dimDestinyTrackerService.bulkFetchKioskItems(vendorItems);
}

export async function fetchRatingsForVendorDef(
  defs: D2ManifestDefinitions,
  vendorDef: DestinyVendorDefinition
): Promise<DestinyTrackerService> {
  const vendorItems = vendorDef.itemList.filter((vid) => isWeaponOrArmor(defs, vid));

  return dimDestinyTrackerService.bulkFetchKioskItems(vendorItems);
}
