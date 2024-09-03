import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimLanguage } from 'app/i18n';
import { getSeason } from 'app/inventory/store/season';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { getItemYear } from 'app/utils/item-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import extraItemCollectibles from 'data/d2/unreferenced-collections-items.json';
import _ from 'lodash';
import { ArmorySearchItem, SearchItemType } from './autocomplete';
import { plainString } from './text-utils';

export interface ArmoryEntry {
  name: string;
  /** The plainString'd version (with diacritics removed, if applicable). */
  plainName: string;
  icon: string;
  hash: number;
  seasonName: string | undefined;
  season: number;
  year: number | undefined;
}

export function buildArmoryIndex(defs: D2ManifestDefinitions | undefined, language: DimLanguage) {
  if (!defs) {
    return undefined;
  }
  const results: ArmoryEntry[] = [];
  const invItemTable = defs.InventoryItem.getAll();
  const seasons = Object.values(defs.Season.getAll());
  const additionalCollectibles = Object.values(extraItemCollectibles);
  for (const h in invItemTable) {
    const i = invItemTable[h];
    if (
      // A good heuristic for "is this weapon not totally irrelevant" is the presence of
      // the exact hash in collections, but some reissues do not reference the latest version
      // in the collections entry (and thus the latest item has no `collectibleHash`).
      // Use `additionalCollectibles` to patch those in. Note that we do not use the
      // `collectibleFinder` because not matching some old items is the entire point here.
      (i.collectibleHash || additionalCollectibles.includes(i.hash)) &&
      i.displayProperties &&
      (i.inventory?.bucketTypeHash === BucketHashes.KineticWeapons ||
        i.inventory?.bucketTypeHash === BucketHashes.EnergyWeapons ||
        i.inventory?.bucketTypeHash === BucketHashes.PowerWeapons)
    ) {
      const season = getSeason(i, defs);
      const seasonName = season
        ? seasons.find((s) => s.seasonNumber === season)?.displayProperties?.name
        : undefined;

      results.push({
        hash: i.hash,
        name: i.displayProperties.name,
        plainName: plainString(i.displayProperties.name, language),
        icon: i.displayProperties.icon,
        seasonName,
        season: season,
        year: getItemYear(i, defs),
      });
    }
  }
  results.sort(
    chainComparator(
      compareBy((entry) => -entry.season),
      compareBy((entry) => entry.name),
    ),
  );
  return results;
}

export function getArmorySuggestions(
  armoryIndex: ArmoryEntry[] | undefined,
  query: string,
  language: DimLanguage,
): ArmorySearchItem[] {
  const plainQuery = plainString(query, language);
  const armoryEntries = query.length
    ? armoryIndex?.filter((armoryItem) => armoryItem.plainName.includes(plainQuery))
    : undefined;

  if (!armoryEntries) {
    return emptyArray();
  }

  // Prefer suggestions that start with the query as opposed to those where it's in the middle
  const sortedEntries = _.sortBy(armoryEntries, (entry) => !entry.plainName.startsWith(plainQuery));

  // If there are more than 10 entries, the user's query is probably not descriptive enough to show many items,
  // But if they've typed enough characters, maybe show some?
  const limitedEntries =
    (sortedEntries.length <= 10 ? sortedEntries : query.length >= 5 && _.take(sortedEntries, 3)) ||
    emptyArray();

  return limitedEntries.map((armoryItem) => ({
    type: SearchItemType.ArmoryEntry,
    query: {
      fullText: query || '',
      body: query || '',
    },
    armoryItem,
  }));
}
