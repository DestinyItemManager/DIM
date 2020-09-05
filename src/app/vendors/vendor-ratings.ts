import { ThunkResult } from 'app/store/types';
import {
  DestinyVendorDefinition,
  DestinyVendorItemDefinition,
  DestinyVendorResponse,
  DestinyVendorSaleItemComponent,
  DestinyVendorsResponse,
} from 'bungie-api-ts/destiny2';
import { StatHashes } from 'data/d2/generated-enums';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { bulkFetchKioskItems, bulkFetchVendorItems } from '../item-review/destiny-tracker.service';
import { DtrRating } from '../item-review/dtr-api-types';

function isWeaponOrArmor(
  defs: D2ManifestDefinitions,
  saleItemComponent: DestinyVendorSaleItemComponent | DestinyVendorItemDefinition
): boolean {
  const itemDef = defs.InventoryItem.get(saleItemComponent.itemHash);
  const inventoryItemStats = itemDef?.stats;
  return (
    inventoryItemStats !== undefined &&
    (inventoryItemStats.primaryBaseStatHash === StatHashes.Attack || // weapon
      inventoryItemStats.primaryBaseStatHash === StatHashes.Defense) // armor
  );
}

export function fetchRatingsForVendors(
  defs: D2ManifestDefinitions,
  vendorsResponse: DestinyVendorsResponse
): ThunkResult<DtrRating[]> {
  const saleComponentArray = Object.values(vendorsResponse.sales.data || {}).map(
    (saleItemComponent) => saleItemComponent.saleItems
  );

  const saleComponents = saleComponentArray
    .flatMap((v) => Object.values(v))
    .filter((sc) => isWeaponOrArmor(defs, sc));

  return bulkFetchVendorItems(saleComponents);
}

export function fetchRatingsForVendor(
  defs: D2ManifestDefinitions,
  vendorResponse: DestinyVendorResponse
): ThunkResult<DtrRating[]> {
  const saleComponents = Object.values(vendorResponse.sales.data || {}).filter((sc) =>
    isWeaponOrArmor(defs, sc)
  );

  return bulkFetchVendorItems(saleComponents);
}

export function fetchRatingsForVendorDef(
  defs: D2ManifestDefinitions,
  vendorDef: DestinyVendorDefinition
): ThunkResult<DtrRating[]> {
  const vendorItems = vendorDef.itemList.filter((vid) => isWeaponOrArmor(defs, vid));

  return bulkFetchKioskItems(vendorItems);
}
