import { D2CalculatedSeason } from 'data/d2/d2-season-info';
import D2EventFromOverlay from 'data/d2/watermark-to-event.json';
import D2SeasonFromOverlay from 'data/d2/watermark-to-season.json';
import { DimItem } from '../item-types';

/** The Destiny season (D2) that a specific item belongs to. */
// TODO: load this lazily with import(). Requires some rework of the filters code.
export function getSeason(item: DimItem): number {
  if (item.classified) {
    return D2CalculatedSeason;
  }

  if (item.iconOverlay || item.hiddenOverlay) {
    return Number(D2SeasonFromOverlay[item?.iconOverlay ?? item.hiddenOverlay!]);
  }

  return D2CalculatedSeason;
}

/** The Destiny event (D2) that a specific item belongs to. */
export function getEvent(item: DimItem) {
  if (item.hiddenOverlay || item.iconOverlay) {
    return Number(D2EventFromOverlay[item?.hiddenOverlay ?? item.iconOverlay!]);
  }
}
