import { ItemCreationContext, makeFakeItem } from 'app/inventory/store/d2-item-factory';
import exoticToCatalystRecordHash from 'data/d2/exotic-to-catalyst-record.json';
import _ from 'lodash';

export function makeItemsForCatalystRecords(itemCreationContext: ItemCreationContext) {
  return new Map(
    Object.entries(exoticToCatalystRecordHash).map(([itemHash, recordHash]) => [
      recordHash!,
      makeFakeItem(itemCreationContext, parseInt(itemHash, 10))!,
    ]),
  );
}

export function makeItemForCatalystRecord(
  recordHash: number,
  itemCreationContext: ItemCreationContext,
) {
  const exoticHash = _.invert(exoticToCatalystRecordHash)[recordHash];
  if (exoticHash) {
    return makeFakeItem(itemCreationContext, parseInt(exoticHash, 10))!;
  }
}
