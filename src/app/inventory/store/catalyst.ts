import {
  DestinyCharacterRecordsComponent,
  DestinyProfileRecordsComponent,
  DestinyRecordState,
} from 'bungie-api-ts/destiny2';
import exoticToCatalystRecordHash from 'data/d2/exotic-to-catalyst-record.json';
import exoticsWithCatalysts from 'data/d2/exotics-with-catalysts';
import { DimCatalyst } from '../item-types';

export function buildCatalystInfo(
  itemHash: number,
  profileRecords: DestinyProfileRecordsComponent | undefined,
  characterRecords: { [key: string]: DestinyCharacterRecordsComponent } | undefined,
): DimCatalyst | undefined {
  if (!exoticsWithCatalysts.has(itemHash)) {
    return undefined;
  }

  const recordHash = exoticToCatalystRecordHash[itemHash];
  const record =
    recordHash &&
    (profileRecords?.records[recordHash] ??
      (characterRecords &&
        Object.values(characterRecords).find((records) => records.records[recordHash])?.records[
          recordHash
        ]));
  if (!record) {
    return undefined;
  }

  // TODO: Can't tell the difference between unlocked and inserted for new-style catalysts?
  const complete = Boolean(
    !(record.state & DestinyRecordState.ObjectiveNotCompleted) ||
      record.state & DestinyRecordState.RecordRedeemed,
  );
  // TODO: seasonal exotics (e.g. Ticuu's) are unlocked by default but still show as obscured - they're run by a quest instead of a record?

  // Need to map from  weapon -> catalyst plug item -> quest that rewards it -> quest in inventory or objectives in profile (across all chars)?
  // if the quest item exists in inventory (how do we figure *that* out?) then it's unlocked and not complete
  // 1. could pass along a set of quest item hashes in all inventories, or all uninstanced objectives that match the quest item
  // 2. could do a second pass on items populating it? rip through all the quest items, find ones whose rewards reference a catalyst, then go back and fix up the items' DimCatalyst info? would need a mapping from item hash to catalyst item hash (which I guess we can match up by name...)
  const unlocked = !(record.state & DestinyRecordState.Obscured);

  return { complete, unlocked, objectives: record.objectives };
}
