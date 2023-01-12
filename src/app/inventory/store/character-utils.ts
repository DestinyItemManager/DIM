import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D1CharacterResponse } from 'app/destiny1/d1-manifest-types';
import { powerLevelByKeyword } from 'app/search/d2-known-values';
import { warnLog } from 'app/utils/log';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { StatHashes } from 'data/d2/generated-enums';
import disciplineIcon from 'images/discipline.png';
import intellectIcon from 'images/intellect.png';
import strengthIcon from 'images/strength.png';
import { DimItem } from '../item-types';
import { DimCharacterStat } from '../store-types';

// Cooldowns
const cooldownsSuperA = ['5:00', '4:46', '4:31', '4:15', '3:58', '3:40'];
const cooldownsSuperB = ['5:30', '5:14', '4:57', '4:39', '4:20', '4:00'];
const cooldownsGrenade = ['1:00', '0:55', '0:49', '0:42', '0:34', '0:25'];
const cooldownsMelee = ['1:10', '1:04', '0:57', '0:49', '0:40', '0:29'];

// thanks to /u/iihavetoes for the bonuses at each level
// thanks to /u/tehdaw for the spreadsheet with bonuses
// https://docs.google.com/spreadsheets/d/1YyFDoHtaiOOeFoqc5Wc_WC2_qyQhBlZckQx5Jd4bJXI/edit?pref=2&pli=1#gid=0
export function getBonus(light: number, type: string): number {
  switch (type.toLowerCase()) {
    case 'helmet':
    case 'helmets':
      return light < 292 ? 15 : light < 307 ? 16 : light < 319 ? 17 : light < 332 ? 18 : 19;
    case 'gauntlets':
      return light < 287 ? 13 : light < 305 ? 14 : light < 319 ? 15 : light < 333 ? 16 : 17;
    case 'chest':
    case 'chest armor':
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
    case 'leg':
    case 'leg armor':
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
    case 'classitem':
    case 'class items':
    case 'ghost':
    case 'ghosts':
      return light < 295 ? 8 : light < 319 ? 9 : 10;
    case 'artifact':
    case 'artifacts':
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
  warnLog('getBonus', 'item bonus not found', type);
  return 0;
}

export const statsWithTiers = [StatHashes.Discipline, StatHashes.Intellect, StatHashes.Strength];
export function getD1CharacterStatTiers(stat: DimCharacterStat) {
  if (!statsWithTiers.includes(stat.hash)) {
    return [];
  }
  const tiers = new Array<number>(5);
  let remaining = stat.value;
  for (let t = 0; t < 5; t++) {
    remaining -= tiers[t] = remaining > 60 ? 60 : remaining;
  }
  return tiers;
}

const stats = [
  'STAT_INTELLECT',
  'STAT_DISCIPLINE',
  'STAT_STRENGTH',
  'STAT_ARMOR',
  'STAT_RECOVERY',
  'STAT_AGILITY',
];

/**
 * Compute character-level stats (int, dis, str).
 */
export function getCharacterStatsData(
  defs: D1ManifestDefinitions,
  data: D1CharacterResponse['character']['base']['characterBase']
) {
  const ret: { [statHash: string]: DimCharacterStat } = {};
  stats.forEach((statId) => {
    const rawStat = data.stats[statId];
    if (!rawStat) {
      return;
    }

    const stat: DimCharacterStat = {
      hash: rawStat.statHash,
      value: rawStat.value,
      name: '',
      description: '',
    };

    switch (statId) {
      case 'STAT_INTELLECT':
        stat.effect = 'Super';
        stat.icon = intellectIcon;
        break;
      case 'STAT_DISCIPLINE':
        stat.effect = 'Grenade';
        stat.icon = disciplineIcon;
        break;
      case 'STAT_STRENGTH':
        stat.effect = 'Melee';
        stat.icon = strengthIcon;
        break;
    }

    const statDef = defs.Stat.get(stat.hash);
    if (statDef) {
      stat.name = statDef.statName; // localized name
      stat.description = statDef.statDescription;
    }

    if (statsWithTiers.includes(stat.hash)) {
      const tier = Math.floor(Math.min(300, stat.value) / 60);
      if (data.peerView) {
        stat.cooldown = getAbilityCooldown(data.peerView.equipment[0].itemHash, statId, tier);
      }
    }

    ret[stat.hash] = stat;
  });
  return ret;
}

// following code is from https://github.com/DestinyTrialsReport
function getAbilityCooldown(subclass: number, ability: string, tier: number) {
  switch (ability) {
    case 'STAT_INTELLECT':
      switch (subclass) {
        case 2007186000: // Defender
        case 4143670656: // Nightstalker
        case 2455559914: // Striker
        case 3658182170: // Sunsinger
          return cooldownsSuperA[tier];
        default:
          return cooldownsSuperB[tier];
      }
    case 'STAT_DISCIPLINE':
      return cooldownsGrenade[tier];
    case 'STAT_STRENGTH':
      switch (subclass) {
        case 4143670656: // Nightstalker
        case 1716862031: // Gunslinger
          return cooldownsMelee[tier];
        default:
          return cooldownsGrenade[tier];
      }
    default:
      return '-:--';
  }
}

export function getClass(type: DestinyClass) {
  switch (type) {
    case DestinyClass.Titan:
      return 'titan';
    case DestinyClass.Hunter:
      return 'hunter';
    case DestinyClass.Warlock:
      return 'warlock';
    case DestinyClass.Unknown:
      return 'unknown';
  }
}

const pinnacleCap = powerLevelByKeyword.pinnaclecap;

/**
 * Does this store (character) have any classified items that might affect their power level?
 * Things to consider:
 * - Classified items don't always lack a power level.
 * - If a char has an equippable item at pinnacle cap in a particular slot,
 *   who cares if there's a classified item in that slot? Not like it's higher.
 *
 * This relies on a precalculated set generated from allItems, using getBucketsWithClassifiedItems.
 */
export function hasAffectingClassified(
  unrestrictedMaxLightGear: DimItem[],
  bucketsWithClassifieds: Set<number>
) {
  return unrestrictedMaxLightGear.some(
    (i) =>
      // isn't pinnacle cap
      i.power !== pinnacleCap &&
      // and shares a bucket with a classified item (which might be higher power)
      bucketsWithClassifieds.has(i.bucket.hash)
  );
}

/** figures out which buckets contain classified items */
export function getBucketsWithClassifiedItems(allItems: DimItem[]) {
  const bucketsWithClassifieds = new Set<number>();
  for (const i of allItems) {
    if (i.classified && !i.power && (i.location.inWeapons || i.location.inArmor)) {
      bucketsWithClassifieds.add(i.bucket.hash);
    }
  }
  return bucketsWithClassifieds;
}
