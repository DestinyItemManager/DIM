import { D2CalculatedSeason, D2CurrentSeason } from '../d2-season-info';
import D2Seasons from 'data/d2/seasons.json';
import D2SeasonToSource from 'data/d2/seasonToSource.json';
import { D2Item } from '../item-types';

const SourceToD2Season = D2SeasonToSource.sources;

// TODO: load this lazily with import(). Requires some rework of the filters code.
export function getSeason(item: D2Item): number {
  if (item.classified) {
    return D2CalculatedSeason;
  }
  if (
    !item.itemCategoryHashes.length ||
    item.typeName === 'Unknown' ||
    item.itemCategoryHashes.some((itemHash) =>
      D2SeasonToSource.categoryBlacklist.includes(itemHash)
    )
  ) {
    return 0;
  }

  if (SourceToD2Season[item.source]) {
    return SourceToD2Season[item.source];
  }

  return D2Seasons[item.hash] || D2CalculatedSeason || D2CurrentSeason;
}
