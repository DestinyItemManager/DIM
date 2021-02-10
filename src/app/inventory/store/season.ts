import { D2SourcesToEvent } from 'data/d2/d2-event-info';
import { D2CalculatedSeason } from 'data/d2/d2-season-info';
import D2Events from 'data/d2/events.json';
import D2SeasonFromSource from 'data/d2/season-to-source.json';
import D2Season from 'data/d2/seasons.json';
import D2SeasonBackup from 'data/d2/seasons_backup.json';
import D2EventFromOverlay from 'data/d2/watermark-to-event.json';
import D2SeasonFromOverlay from 'data/d2/watermark-to-season.json';
import { DimItem } from '../item-types';

/** The Destiny season (D2) that a specific item belongs to. */
// TODO: load this lazily with import(). Requires some rework of the filters code.

const SourceToD2Season = D2SeasonFromSource.sources;

export function getSeason(item: DimItem): number {
  if (item.classified) {
    return D2CalculatedSeason;
  }
  // iconOverlay has precedence for season
  const overlay = item.iconOverlay || item.hiddenOverlay;

  if (item.source && SourceToD2Season[item.source]) {
    return SourceToD2Season[item.source];
  }

  return overlay
    ? Number(D2SeasonFromOverlay[overlay]) || D2SeasonBackup[item.hash]
    : D2Season[item.hash] || D2CalculatedSeason;
}

/** The Destiny event (D2) that a specific item belongs to. */
export function getEvent(item: DimItem) {
  // hiddenOverlay has precedence for event
  const overlay = item.hiddenOverlay || item.iconOverlay;
  const D2EventBackup = item.source
    ? D2SourcesToEvent[item.source] || D2Events[item.hash]
    : D2Events[item.hash];

  return overlay ? Number(D2EventFromOverlay[overlay]) || D2EventBackup : D2EventBackup;
}
