import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { D2EventEnum, D2EventInfo } from 'data/d2/d2-event-info-v2';
import { D2CalculatedSeason } from 'data/d2/d2-season-info';
import D2Events from 'data/d2/events.json';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import D2SeasonFromSource from 'data/d2/season-to-source.json';
import D2Season from 'data/d2/seasons.json';
import D2SeasonBackup from 'data/d2/seasons_backup.json';
import D2EventFromOverlay from 'data/d2/watermark-to-event.json';
import D2SeasonFromOverlay from 'data/d2/watermark-to-season.json';
import { DimItem } from '../item-types';

/** The Destiny season (D2) that a specific item belongs to. */
// TODO: load this lazily with import(). Requires some rework of the filters code.

export type D2EventIndex = keyof typeof D2EventInfo;

const D2SourcesToEvent: Record<number, D2EventIndex> = {};

for (const [, eventAttrs] of Object.entries(D2EventInfo)) {
  for (const source of eventAttrs.sources) {
    switch (eventAttrs.name.replace('The ', '').toUpperCase().split(' ').join('_')) {
      case 'DAWNING':
        D2SourcesToEvent[source] = D2EventEnum.DAWNING;
        break;
      case 'CRIMSON_DAYS':
        D2SourcesToEvent[source] = D2EventEnum.CRIMSON_DAYS;
        break;
      case 'SOLSTICE_OF_HEROES':
        D2SourcesToEvent[source] = D2EventEnum.SOLSTICE_OF_HEROES;
        break;
      case 'FESTIVAL_OF_THE_LOST':
        D2SourcesToEvent[source] = D2EventEnum.FESTIVAL_OF_THE_LOST;
        break;
      case 'REVELRY':
        D2SourcesToEvent[source] = D2EventEnum.REVELRY;
        break;
      case 'GUARDIAN_GAMES':
        D2SourcesToEvent[source] = D2EventEnum.GUARDIAN_GAMES;
        break;
    }
  }
}

export function getSeason(
  item: DimItem | DestinyInventoryItemDefinition,
  defs?: D2ManifestDefinitions,
): number {
  const asDimItem = ('destinyVersion' in item && item) || undefined;
  const asDef = ('displayProperties' in item && item) || undefined;
  if (asDimItem?.classified || asDef?.redacted) {
    return D2CalculatedSeason;
  }

  if (
    !item.itemCategoryHashes ||
    item.itemCategoryHashes.includes(ItemCategoryHashes.Materials) ||
    item.itemCategoryHashes.includes(ItemCategoryHashes.Dummies) ||
    item.itemCategoryHashes.length === 0
  ) {
    return -1;
  }

  if (asDef) {
    const source =
      asDef.collectibleHash && defs?.Collectible.get(asDef.collectibleHash)?.sourceHash;
    const currentVersion = asDef.quality?.currentVersion;
    const iconOverlay =
      (currentVersion !== undefined &&
        asDef.quality?.displayVersionWatermarkIcons?.[currentVersion]) ||
      asDef.iconWatermark ||
      asDef.iconWatermarkShelved ||
      undefined;
    return getSeasonFromOverlayAndSource(iconOverlay, source, asDef.hash);
  } else if (asDimItem) {
    return getSeasonFromOverlayAndSource(
      asDimItem.iconOverlay || asDimItem.hiddenOverlay,
      asDimItem.source,
      asDimItem.hash,
    );
  } else {
    return D2CalculatedSeason;
  }
}

function getSeasonFromOverlayAndSource(
  overlay: string | undefined,
  source: number | undefined,
  hash: number,
) {
  if (overlay && D2SeasonFromOverlay[overlay]) {
    return D2SeasonFromOverlay[overlay]!;
  }

  if (source && D2SeasonFromSource[source]) {
    return D2SeasonFromSource[source]!;
  }

  // D2Season and D2SeasonBackup have the same structure, but some of the hashes
  // in D2SeasonBackup are not in D2Season.
  return D2Season[hash] || D2SeasonBackup[hash] || D2CalculatedSeason;
}

/** The Destiny event (D2) that a specific item belongs to. */
export function getEvent(item: DimItem): D2EventIndex {
  // hiddenOverlay has precedence for event
  const overlay = item.hiddenOverlay || item.iconOverlay;
  const D2EventBackup = item.source
    ? D2SourcesToEvent[item.source] || (D2Events as Record<number, D2EventIndex>)[item.hash]
    : (D2Events as Record<number, D2EventIndex>)[item.hash];

  return overlay
    ? (D2EventFromOverlay as Record<string, D2EventIndex>)[overlay] || D2EventBackup
    : D2EventBackup;
}
