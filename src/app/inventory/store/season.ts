import { D2SourcesToEvent } from 'data/d2/d2-event-info';
import { D2CalculatedSeason } from 'data/d2/d2-season-info';
import D2Events from 'data/d2/events.json';
import D2SeasonToSource from 'data/d2/season-to-source.json';
import D2Seasons from 'data/d2/seasons.json';
import D2SeasonFromOverlay from 'data/d2/watermark-to-season.json';
import { D2Item } from '../item-types';

const SourceToD2Season = D2SeasonToSource.sources;

/** The Destiny season (D2) that a specific item belongs to. */
// TODO: load this lazily with import(). Requires some rework of the filters code.
export function getSeason(item: D2Item): number {
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

  if (item.iconOverlay) {
    return Number(D2SeasonFromOverlay[item.iconOverlay]);
  }

  if (SourceToD2Season[item.source]) {
    return SourceToD2Season[item.source];
  }

  return D2Seasons[item.hash] || D2CalculatedSeason;
}

/** The Destiny event (D2) that a specific item belongs to. */
export function getEvent(item: D2Item) {
  return item.source ? D2SourcesToEvent[item.source] || D2Events[item.hash] : D2Events[item.hash];
}
