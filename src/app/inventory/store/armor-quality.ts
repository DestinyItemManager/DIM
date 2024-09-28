import { D1BucketHashes } from 'app/search/d1-known-values';
import { BucketHashes } from 'data/d2/generated-enums';
import { D1Stat } from '../item-types';

/**
 * Calculate stat ranges for armor. This also modifies the input stats to add per-stat quality ratings.
 *
 * @param stats a list of the item's stats
 * @param light the item's defense
 * @param type a string indicating the item's type
 */
// thanks to bungie armory for the max-base stats
// thanks to /u/iihavetoes for rates + equation
// https://www.reddit.com/r/DestinyTheGame/comments/4geixn/a_shift_in_how_we_view_stat_infusion_12tier/
// TODO set a property on a bucket saying whether it can have quality rating, etc
export function getQualityRating(
  stats: D1Stat[] | null,
  light: { value: number },
  bucketHash: BucketHashes | D1BucketHashes,
): {
  min: number;
  max: number;
  range: string;
} | null {
  if (!stats?.length || !light || light.value < 280) {
    return null;
  }

  let split = 0;
  switch (bucketHash) {
    case BucketHashes.Helmet:
      split = 46; // bungie reports 48, but i've only seen 46
      break;
    case BucketHashes.Gauntlets:
      split = 41; // bungie reports 43, but i've only seen 41
      break;
    case BucketHashes.ChestArmor:
      split = 61;
      break;
    case BucketHashes.LegArmor:
      split = 56;
      break;
    case BucketHashes.ClassArmor:
    case BucketHashes.Ghost:
      split = 25;
      break;
    case D1BucketHashes.Artifact:
      split = 38;
      break;
    default:
      return null;
  }

  const ret = {
    total: {
      min: 0,
      max: 0,
    },
    max: split * 2,
  };

  let pure = 0;
  for (const stat of stats) {
    let scaled = {
      min: 0,
      max: 0,
    };
    if (stat.base) {
      scaled = getScaledStat(stat.base, light.value);
      pure = scaled.min;
    }
    stat.scaled = scaled;
    stat.split = split;
    stat.qualityPercentage = {
      range: '',
      min: Math.round((100 * stat.scaled.min) / stat.split),
      max: Math.round((100 * stat.scaled.max) / stat.split),
    };
    ret.total.min += scaled.min || 0;
    ret.total.max += scaled.max || 0;
  }

  if (pure === ret.total.min) {
    for (const stat of stats) {
      if (stat.scaled) {
        stat.scaled = {
          min: Math.floor(stat.scaled.min / 2),
          max: Math.floor(stat.scaled.max / 2),
        };
        if (stat.split) {
          stat.qualityPercentage = {
            range: '',
            min: Math.round((100 * stat.scaled.min) / stat.split),
            max: Math.round((100 * stat.scaled.max) / stat.split),
          };
        }
      }
    }
  }

  let quality = {
    min: Math.round((ret.total.min / ret.max) * 100),
    max: Math.round((ret.total.max / ret.max) * 100),
    range: '',
  };

  if (bucketHash !== D1BucketHashes.Artifact) {
    for (const stat of stats) {
      if (stat.qualityPercentage) {
        stat.qualityPercentage = {
          range: '',
          min: Math.min(100, stat.qualityPercentage.min),
          max: Math.min(100, stat.qualityPercentage.max),
        };
      }
    }
    quality = {
      min: Math.min(100, quality.min),
      max: Math.min(100, quality.max),
      range: '',
    };
  }

  for (const stat of stats) {
    if (stat.qualityPercentage) {
      stat.qualityPercentage.range = getQualityRange(light.value, stat.qualityPercentage);
    }
  }
  quality.range = getQualityRange(light.value, quality);

  return quality;
}

// For a quality property, return a range string (min-max percentage)
function getQualityRange(light: number, quality: { min: number; max: number }): string {
  if (!quality) {
    return '';
  }

  if (light > 335) {
    light = 335;
  }

  return `${
    quality.min === quality.max || light === 335 ? quality.min : `${quality.min}%-${quality.max}`
  }%`;
}

function fitValue(light: number) {
  if (light > 300) {
    return 0.2546 * light - 23.825;
  } else if (light > 200) {
    return 0.1801 * light - 1.4612;
  } else {
    return -1;
  }
}

function getScaledStat(base: number, light: number) {
  const max = 335;

  if (light > 335) {
    light = 335;
  }

  return {
    min: Math.floor(base * (fitValue(max) / fitValue(light))),
    max: Math.floor((base + 1) * (fitValue(max) / fitValue(light))),
  };
}
