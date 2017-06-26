/**
 * Utilities for calculating armor quality.
 */
export {
  getQualityRating
};

/**
 * Calculate stat ranges for armor. This also modifies the input stats to add per-stat quality ratings.
 *
 * @param {Array} stats a list of the item's stats
 * @param {Number} light the item's defense
 * @param {String} type a string indicating the item's type
 * @return {{ min, max, range }}
 */
// thanks to bungie armory for the max-base stats
// thanks to /u/iihavetoes for rates + equation
// https://www.reddit.com/r/DestinyTheGame/comments/4geixn/a_shift_in_how_we_view_stat_infusion_12tier/
// TODO set a property on a bucket saying whether it can have quality rating, etc
function getQualityRating(stats, light, type) {
  if (!stats || !stats.length || !light || light.value < 280) {
    return null;
  }

  let split = 0;
  switch (type.toLowerCase()) {
  case 'helmet':
    split = 46; // bungie reports 48, but i've only seen 46
    break;
  case 'gauntlets':
    split = 41; // bungie reports 43, but i've only seen 41
    break;
  case 'chest':
    split = 61;
    break;
  case 'leg':
    split = 56;
    break;
  case 'classitem':
  case 'ghost':
    split = 25;
    break;
  case 'artifact':
    split = 38;
    break;
  default:
    return null;
  }

  const ret = {
    total: {
      min: 0,
      max: 0
    },
    max: split * 2
  };

  let pure = 0;
  stats.forEach((stat) => {
    let scaled = {
      min: 0,
      max: 0
    };
    if (stat.base) {
      scaled = getScaledStat(stat.base, light.value);
      pure = scaled.min;
    }
    stat.scaled = scaled;
    stat.split = split;
    stat.qualityPercentage = {
      min: Math.round(100 * stat.scaled.min / stat.split),
      max: Math.round(100 * stat.scaled.max / stat.split)
    };
    ret.total.min += scaled.min || 0;
    ret.total.max += scaled.max || 0;
  });

  if (pure === ret.total.min) {
    stats.forEach((stat) => {
      stat.scaled = {
        min: Math.floor(stat.scaled.min / 2),
        max: Math.floor(stat.scaled.max / 2)
      };
      stat.qualityPercentage = {
        min: Math.round(100 * stat.scaled.min / stat.split),
        max: Math.round(100 * stat.scaled.max / stat.split)
      };
    });
  }

  let quality = {
    min: Math.round(ret.total.min / ret.max * 100),
    max: Math.round(ret.total.max / ret.max * 100)
  };

  if (type.toLowerCase() !== 'artifact') {
    stats.forEach((stat) => {
      stat.qualityPercentage = {
        min: Math.min(100, stat.qualityPercentage.min),
        max: Math.min(100, stat.qualityPercentage.max)
      };
    });
    quality = {
      min: Math.min(100, quality.min),
      max: Math.min(100, quality.max)
    };
  }

  stats.forEach((stat) => {
    stat.qualityPercentage.range = getQualityRange(light.value, stat.qualityPercentage);
  });
  quality.range = getQualityRange(light.value, quality);

  return quality;
}

// For a quality property, return a range string (min-max percentage)
function getQualityRange(light, quality) {
  if (!quality) {
    return '';
  }

  if (light > 335) {
    light = 335;
  }

  return `${(quality.min === quality.max || light === 335)
          ? quality.min
          : (`${quality.min}%-${quality.max}`)}%`;
}

function fitValue(light) {
  if (light > 300) {
    return (0.2546 * light) - 23.825;
  } if (light > 200) {
    return (0.1801 * light) - 1.4612;
  } else {
    return -1;
  }
}

function getScaledStat(base, light) {
  const max = 335;

  if (light > 335) {
    light = 335;
  }

  return {
    min: Math.floor((base) * (fitValue(max) / fitValue(light))),
    max: Math.floor((base + 1) * (fitValue(max) / fitValue(light)))
  };
}