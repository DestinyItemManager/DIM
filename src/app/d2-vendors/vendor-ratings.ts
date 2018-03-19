import { DestinyTrackerServiceType } from "../item-review/destiny-tracker.service";
import { DestinyVendorsResponse, DestinyVendorSaleItemComponent, DestinyVendorResponse } from "bungie-api-ts/destiny2";
import { D2ReviewDataCache } from "../destinyTrackerApi/d2-reviewDataCache";

export function fetchRatingsAndGetCache(destinyTrackerService: DestinyTrackerServiceType,
                                        vendorsResponse?: DestinyVendorsResponse,
                                        vendorResponse?: DestinyVendorResponse): D2ReviewDataCache {
  if (vendorsResponse) {
    const saleComponentArray = Object.values(vendorsResponse.sales.data)
      .map((saleItemComponent) => saleItemComponent.saleItems);

    const saleComponents = ([] as DestinyVendorSaleItemComponent[]).concat(...saleComponentArray.map((v) => Object.values(v)));

    destinyTrackerService.bulkFetchVendorItems(saleComponents);
  } else if (vendorResponse) {
    const saleComponents = Object.values(vendorResponse.sales.data);

    destinyTrackerService.bulkFetchVendorItems(saleComponents);
  } else {
    throw new Error("No response was supplied.");
  }

  return destinyTrackerService.getD2ReviewDataCache();
}
