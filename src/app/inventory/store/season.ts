import { D2CalculatedSeason } from 'data/d2/d2-season-info';
import D2Seasons from 'data/d2/seasons.json';
import D2SeasonToSource from 'data/d2/season-to-source.json';
import D2SeasonFromOverlay from 'data/d2/watermark-to-season.json';
import { D2Item } from '../item-types';

const SourceToD2Season = D2SeasonToSource.sources;

// TODO: load this lazily with import(). Requires some rework of the filters code.
export function getSeason(item: D2Item, watermark: string | null): number {
  if (item.classified) {
    return D2CalculatedSeason;
  }
  if (
    !item.itemCategoryHashes.length ||
    item.typeName === 'Unknown' ||
    item.itemCategoryHashes.some((itemHash) => D2SeasonToSource.categoryDenyList.includes(itemHash))
  ) {
    return 0;
  }

  if (watermark) {
    return Number(D2SeasonFromOverlay[watermark]);
  }

  if (SourceToD2Season[item.source]) {
    return SourceToD2Season[item.source];
  }

  return D2Seasons[item.hash] || D2CalculatedSeason;
}
