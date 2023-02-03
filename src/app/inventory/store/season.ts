import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { D2EventIndex, D2SourcesToEvent } from 'data/d2/d2-event-info';
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

const SourceToD2Season: Record<number, number> = D2SeasonFromSource.sources;

export function getSeason(
  item: DimItem | DestinyInventoryItemDefinition,
  defs?: D2ManifestDefinitions
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
      asDimItem.hash
    );
  } else {
    return D2CalculatedSeason;
  }
}

function getSeasonFromOverlayAndSource(
  overlay: string | undefined,
  source: number | undefined,
  hash: number
) {
  if (source && SourceToD2Season[source] && !overlay) {
    return SourceToD2Season[source];
  }

  return overlay
    ? Number((D2SeasonFromOverlay as Record<string, number>)[overlay]) ||
        (D2SeasonBackup as Record<number, number>)[hash]
    : (D2Season as Record<number, number>)[hash] || D2CalculatedSeason;
}

/** The Destiny event (D2) that a specific item belongs to. */
export function getEvent(item: DimItem): D2EventIndex {
  // hiddenOverlay has precedence for event
  const overlay = item.hiddenOverlay || item.iconOverlay;
  const D2EventBackup = item.source
    ? (D2SourcesToEvent as Record<number, D2EventIndex>)[item.source] ||
      (D2Events as Record<number, D2EventIndex>)[item.hash]
    : (D2Events as Record<number, D2EventIndex>)[item.hash];

  return overlay
    ? (D2EventFromOverlay as Record<string, D2EventIndex>)[overlay] || D2EventBackup
    : D2EventBackup;
}
