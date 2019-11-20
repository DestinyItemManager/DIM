import { bulkFetchVendorItems, bulkFetchKioskItems } from '../item-review/destiny-tracker.service';
import {
  DestinyVendorsResponse,
  DestinyVendorSaleItemComponent,
  DestinyVendorResponse,
  DestinyVendorItemDefinition,
  DestinyVendorDefinition
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { ThunkResult } from '../store/reducers';
import { DtrRating } from '../item-review/dtr-api-types';

function isWeaponOrArmor(
  defs: D2ManifestDefinitions,
  saleItemComponent: DestinyVendorSaleItemComponent | DestinyVendorItemDefinition
): boolean {
  const itemDef = defs.InventoryItem.get(saleItemComponent.itemHash);
  const inventoryItemStats = itemDef?.stats;
  return (
    inventoryItemStats &&
    (inventoryItemStats.primaryBaseStatHash === 1480404414 || // weapon
      inventoryItemStats.primaryBaseStatHash === 3897883278)
  ); // armor
}

export function fetchRatingsForVendors(
  defs: D2ManifestDefinitions,
  vendorsResponse: DestinyVendorsResponse
): ThunkResult<Promise<DtrRating[]>> {
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
): ThunkResult<Promise<DtrRating[]>> {
  const saleComponents = Object.values(vendorResponse.sales.data || {}).filter((sc) =>
    isWeaponOrArmor(defs, sc)
  );

  return bulkFetchVendorItems(saleComponents);
}

export function fetchRatingsForVendorDef(
  defs: D2ManifestDefinitions,
  vendorDef: DestinyVendorDefinition
): ThunkResult<Promise<DtrRating[]>> {
  const vendorItems = vendorDef.itemList.filter((vid) => isWeaponOrArmor(defs, vid));

  return bulkFetchKioskItems(vendorItems);
}
