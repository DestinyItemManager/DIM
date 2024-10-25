import { ItemCreationContext, makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { invert } from 'app/utils/collections';
import exoticToCatalystRecordHash from 'data/d2/exotic-to-catalyst-record.json';

export function makeItemsForCatalystRecords(itemCreationContext: ItemCreationContext) {
  return new Map(
    Object.entries(exoticToCatalystRecordHash).map(([itemHash, recordHash]) => [
      recordHash!,
      makeFakeItem(itemCreationContext, parseInt(itemHash, 10))!,
    ]),
  );
}

const catalystRecordHashToExoticHash = invert(exoticToCatalystRecordHash, Number);

export function makeItemForCatalystRecord(
  recordHash: number,
  itemCreationContext: ItemCreationContext,
) {
  const exoticHash = catalystRecordHashToExoticHash[recordHash];
  if (exoticHash) {
    return makeFakeItem(itemCreationContext, exoticHash)!;
  }
}
