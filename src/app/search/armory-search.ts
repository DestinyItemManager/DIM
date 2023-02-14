import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { getSeason } from 'app/inventory/store/season';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { getItemYear } from 'app/utils/item-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import memoizeOne from 'memoize-one';
import { ArmorySearchItem, SearchItemType } from './autocomplete';

export interface ArmoryEntry {
  name: string;
  icon: string;
  hash: number;
  seasonName: string | undefined;
  season: number;
  year: number | undefined;
}

export const buildArmoryIndex = memoizeOne((defs: D2ManifestDefinitions) => {
  const results: ArmoryEntry[] = [];
  const invItemTable = defs.InventoryItem.getAll();
  const seasons = Object.values(defs.Season.getAll());
  for (const h in invItemTable) {
    const i = invItemTable[h];
    if (
      i.collectibleHash &&
      i.displayProperties &&
      (i.inventory?.bucketTypeHash === BucketHashes.KineticWeapons ||
        i.inventory?.bucketTypeHash === BucketHashes.EnergyWeapons ||
        i.inventory?.bucketTypeHash === BucketHashes.PowerWeapons)
    ) {
      // Skip sunset weapons
      const powerCapHash = i.quality?.versions?.[i.quality.currentVersion]?.powerCapHash;
      const powerCap = powerCapHash && defs.PowerCap.get(powerCapHash).powerCap;
      if (powerCap && powerCap < 1310) {
        continue;
      }

      const season = getSeason(i, defs);
      const seasonName = season
        ? seasons.find((s) => s.seasonNumber === season)?.displayProperties?.name
        : undefined;

      results.push({
        hash: i.hash,
        name: i.displayProperties.name,
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
      compareBy((entry) => entry.name)
    )
  );
  return results;
});

export function getArmorySuggestions(
  armoryIndex: ArmoryEntry[] | undefined,
  query: string
): ArmorySearchItem[] {
  const armoryEntries = query.length
    ? armoryIndex?.filter((armoryItem) => armoryItem.name.toLocaleLowerCase().includes(query))
    : undefined;

  if (!armoryEntries) {
    return emptyArray();
  }

  // Prefer suggestions that start with the query as opposed to those where it's in the middle
  const sortedEntries = _.sortBy(
    armoryEntries,
    (entry) => !entry.name.toLocaleLowerCase().startsWith(query)
  );

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
