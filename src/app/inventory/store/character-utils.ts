import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D1Character, D1StatDefinition } from 'app/destiny1/d1-manifest-types';
import { ArmorTypes } from 'app/destiny1/loadout-builder/types';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { BucketHashes } from 'data/d2/generated-enums';
import { DimCharacterStat } from '../store-types';

/**
 * D1 specific armor bonus calculation.
 */
// thanks to /u/iihavetoes for the bonuses at each level
// thanks to /u/tehdaw for the spreadsheet with bonuses
// https://docs.google.com/spreadsheets/d/1YyFDoHtaiOOeFoqc5Wc_WC2_qyQhBlZckQx5Jd4bJXI/edit?pref=2&pli=1#gid=0
export function getBonus(light: number, bucketHash: ArmorTypes): number {
  switch (bucketHash) {
    case BucketHashes.Helmet:
      return light < 292 ? 15 : light < 307 ? 16 : light < 319 ? 17 : light < 332 ? 18 : 19;
    case BucketHashes.Gauntlets:
      return light < 287 ? 13 : light < 305 ? 14 : light < 319 ? 15 : light < 333 ? 16 : 17;
    case BucketHashes.ChestArmor:
      return light < 287
        ? 20
        : light < 300
          ? 21
          : light < 310
            ? 22
            : light < 319
              ? 23
              : light < 328
                ? 24
                : 25;
    case BucketHashes.LegArmor:
      return light < 284
        ? 18
        : light < 298
          ? 19
          : light < 309
            ? 20
            : light < 319
              ? 21
              : light < 329
                ? 22
                : 23;
    case BucketHashes.ClassArmor:
    case BucketHashes.Ghost:
      return light < 295 ? 8 : light < 319 ? 9 : 10;
    case D1BucketHashes.Artifact:
      return light < 287
        ? 34
        : light < 295
          ? 35
          : light < 302
            ? 36
            : light < 308
              ? 37
              : light < 314
                ? 38
                : light < 319
                  ? 39
                  : light < 325
                    ? 40
                    : light < 330
                      ? 41
                      : light < 336
                        ? 42
                        : 43;
  }
}

/**
 * Compute D1 character-level stats (int, dis, str).
 */
export function getCharacterStatsData(
  defs: D1ManifestDefinitions,
  data: D1Character['characterBase'],
) {
  const ret: { [statHash: string]: DimCharacterStat } = {};
  for (const statId of ['STAT_DISCIPLINE', 'STAT_INTELLECT', 'STAT_STRENGTH'] as const) {
    const rawStat = data.stats[statId];
    if (!rawStat) {
      continue;
    }
    const statDef = defs.Stat.get(rawStat.statHash);
    ret[statDef.hash] = characterStatFromStatDef(statDef, rawStat.value);
  }
  return ret;
}

export function characterStatFromStatDef(
  statDef: D1StatDefinition,
  value: number,
): DimCharacterStat {
  return {
    hash: statDef.statHash,
    displayProperties: {
      name: statDef.statName,
      description: statDef.statDescription,
      icon: statDef.icon,
      hasIcon: Boolean(statDef.icon),
      highResIcon: '',
      iconSequences: [],
    },
    value,
  };
}
