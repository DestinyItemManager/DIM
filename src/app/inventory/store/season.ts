import { D2CalculatedSeason } from 'data/d2/d2-season-info';
import D2SeasonBackup from 'data/d2/seasons_backup.json';
import D2EventFromOverlay from 'data/d2/watermark-to-event.json';
import D2SeasonFromOverlay from 'data/d2/watermark-to-season.json';
import { DimItem } from '../item-types';

/** The Destiny season (D2) that a specific item belongs to. */
// TODO: load this lazily with import(). Requires some rework of the filters code.
export function getSeason(item: DimItem): number {
  if (item.classified) {
    return D2CalculatedSeason;
  }
  // iconOverlay has precedence for season
  const overlay = item.iconOverlay || item.hiddenOverlay;
  if (overlay) {
    return Number(D2SeasonFromOverlay[overlay]) || D2SeasonBackup[item.hash];
  }

  return D2CalculatedSeason;
}

/** The Destiny event (D2) that a specific item belongs to. */
export function getEvent(item: DimItem) {
  // hiddenOverlay has precedence for event
  const overlay = item.hiddenOverlay || item.iconOverlay;
  if (overlay) {
    return Number(D2EventFromOverlay[overlay]);
  }
}
