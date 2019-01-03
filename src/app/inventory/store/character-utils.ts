import intellectIcon from 'app/images/intellect.png';
import disciplineIcon from 'app/images/discipline.png';
import strengthIcon from 'app/images/strength.png';
import { D1CharacterStat } from '../store-types';

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
  console.warn('item bonus not found', type);
  return 0;
}

const statsWithTiers = new Set(['STAT_INTELLECT', 'STAT_DISCIPLINE', 'STAT_STRENGTH']);
const stats = [
  'STAT_INTELLECT',
  'STAT_DISCIPLINE',
  'STAT_STRENGTH',
  'STAT_ARMOR',
  'STAT_RECOVERY',
  'STAT_AGILITY'
];

/**
 * Compute character-level stats (int, dis, str).
 */
export function getCharacterStatsData(statDefs, data) {
  const ret: { [statHash: string]: D1CharacterStat } = {};
  stats.forEach((statId) => {
    const stat = data.stats[statId];
    if (!stat) {
      return;
    }

    const statHash: D1CharacterStat = {
      id: statId,
      value: stat.value
    };

    statHash.id = statId;
    switch (statId) {
      case 'STAT_INTELLECT':
        statHash.name = 'Intellect';
        statHash.effect = 'Super';
        statHash.icon = intellectIcon;
        break;
      case 'STAT_DISCIPLINE':
        statHash.name = 'Discipline';
        statHash.effect = 'Grenade';
        statHash.icon = disciplineIcon;
        break;
      case 'STAT_STRENGTH':
        statHash.name = 'Strength';
        statHash.effect = 'Melee';
        statHash.icon = strengthIcon;
        break;
    }

    const statDef = statDefs.get(stat.statHash);
    if (statDef) {
      statHash.name = statDef.statName; // localized name
    }

    if (statsWithTiers.has(statId)) {
      statHash.normalized = statHash.value > 300 ? 300 : statHash.value;
      statHash.tier = Math.floor(statHash.normalized / 60);
      statHash.tierMax = 60;
      statHash.tiers = [];
      statHash.remaining = statHash.value;
      for (let t = 0; t < 5; t++) {
        statHash.remaining -= statHash.tiers[t] = statHash.remaining > 60 ? 60 : statHash.remaining;
      }
      if (data.peerView) {
        statHash.cooldown = getAbilityCooldown(
          data.peerView.equipment[0].itemHash,
          statId,
          statHash.tier
        );
      }
      statHash.percentage = Number((100 * statHash.normalized) / 300).toFixed();
    } else {
      statHash.percentage = Number((100 * statHash.value) / 10).toFixed();
    }

    ret[statId] = statHash;
  });
  return ret;
}

// following code is from https://github.com/DestinyTrialsReport
export function getAbilityCooldown(subclass, ability, tier) {
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

export function getClass(type: number) {
  switch (type) {
    case 0:
      return 'titan';
    case 1:
      return 'hunter';
    case 2:
      return 'warlock';
  }
  return 'unknown';
}
