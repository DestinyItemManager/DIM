

// Cooldowns
const cooldownsSuperA = ['5:00', '4:46', '4:31', '4:15', '3:58', '3:40'];
const cooldownsSuperB = ['5:30', '5:14', '4:57', '4:39', '4:20', '4:00'];
const cooldownsGrenade = ['1:00', '0:55', '0:49', '0:42', '0:34', '0:25'];
const cooldownsMelee = ['1:10', '1:04', '0:57', '0:49', '0:40', '0:29'];

/**
 * Compute character-level stats (int, dis, str).
 */
export function getCharacterStatsData(statDefs, data) {
  const statsWithTiers = new Set(['STAT_INTELLECT', 'STAT_DISCIPLINE', 'STAT_STRENGTH']);
  const stats = ['STAT_INTELLECT', 'STAT_DISCIPLINE', 'STAT_STRENGTH', 'STAT_ARMOR', 'STAT_RECOVERY', 'STAT_AGILITY'];
  const ret = {};
  stats.forEach((statId) => {
    const statHash = {};
    statHash.id = statId;
    switch (statId) {
    case 'STAT_INTELLECT':
      statHash.name = 'Intellect';
      statHash.effect = 'Super';
      statHash.icon = require('app/images/intellect.png');
      break;
    case 'STAT_DISCIPLINE':
      statHash.name = 'Discipline';
      statHash.effect = 'Grenade';
      statHash.icon = require('app/images/discipline.png');
      break;
    case 'STAT_STRENGTH':
      statHash.name = 'Strength';
      statHash.effect = 'Melee';
      statHash.icon = require('app/images/strength.png');
      break;
    }

    const stat = data.stats[statId];
    if (!stat) {
      return;
    }
    statHash.value = stat.value;
    const statDef = statDefs.get(stat.statHash);
    if (statDef) {
      statHash.name = statDef.statName; // localized name
    }

    if (statsWithTiers.has(statId)) {
      statHash.normalized = statHash.value > 300 ? 300 : statHash.value;
      statHash.tier = Math.floor(statHash.normalized / 60);
      statHash.tiers = [];
      statHash.remaining = statHash.value;
      for (let t = 0; t < 5; t++) {
        statHash.remaining -= statHash.tiers[t] = statHash.remaining > 60 ? 60 : statHash.remaining;
      }
      if (data.peerView) {
        statHash.cooldown = getAbilityCooldown(data.peerView.equipment[0].itemHash, statId, statHash.tier);
      }
      statHash.percentage = Number(100 * statHash.normalized / 300).toFixed();
    } else {
      statHash.percentage = Number(100 * statHash.value / 10).toFixed();
    }

    ret[statId] = statHash;
  });
  return ret;
}

// following code is from https://github.com/DestinyTrialsReport
export function getAbilityCooldown(subclass, ability, tier) {
  if (ability === 'STAT_INTELLECT') {
    switch (subclass) {
    case 2007186000: // Defender
    case 4143670656: // Nightstalker
    case 2455559914: // Striker
    case 3658182170: // Sunsinger
      return cooldownsSuperA[tier];
    default:
      return cooldownsSuperB[tier];
    }
  } else if (ability === 'STAT_DISCIPLINE') {
    return cooldownsGrenade[tier];
  } else if (ability === 'STAT_STRENGTH') {
    switch (subclass) {
    case 4143670656: // Nightstalker
    case 1716862031: // Gunslinger
      return cooldownsMelee[tier];
    default:
      return cooldownsGrenade[tier];
    }
  } else {
    return '-:--';
  }
}

export function getClass(type) {
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