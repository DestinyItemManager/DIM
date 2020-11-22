import { DimStore } from 'app/inventory/store-types';
import { DestinyInventoryItemDefinition, DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import { D2CalculatedSeason, D2SeasonInfo } from 'data/d2/d2-season-info';
import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import styles from './Reward.m.scss';

const enum PowerCap {
  Pinnacle,
  Powerful,
}

const engrams = {
  // Pinnacle
  73143230: {
    cap: PowerCap.Pinnacle,
    bonus: 5,
  },
  // Tier 1
  3114385605: {
    cap: PowerCap.Powerful,
    bonus: 3,
  },
  // Powerful
  4039143015: {
    cap: PowerCap.Powerful,
    bonus: 3,
  },
  // Tier 2
  3114385606: {
    cap: PowerCap.Powerful,
    bonus: 4,
  },
  // Tier 3
  3114385607: {
    cap: PowerCap.Powerful,
    bonus: 5,
  },
};

export function Reward({
  reward,
  defs,
  store,
}: {
  reward: DestinyItemQuantity;
  defs: D2ManifestDefinitions;
  // If provided, will help make engram bonuses more accurate
  store?: DimStore;
}) {
  const rewardItem = defs.InventoryItem.get(reward.itemHash);
  const rewardDisplay = rewardItem.displayProperties;

  const powerBonus = getEngramPowerBonus(rewardItem, store?.stats.maxGearPower?.value);

  return (
    <div className={styles.reward}>
      <BungieImage src={rewardDisplay.icon} alt="" />
      <span>
        {powerBonus && `+${powerBonus} `}
        {rewardDisplay.name}
        {reward.quantity > 1 && ` +${reward.quantity.toLocaleString()}`}
      </span>
    </div>
  );
}

function getEngramPowerBonus(item: DestinyInventoryItemDefinition, maxPower?: number) {
  const engramInfo = engrams[item.hash];
  if (!engramInfo) {
    return undefined;
  }

  maxPower ||= 0;
  const season = D2SeasonInfo[D2CalculatedSeason];
  if (engramInfo.cap === PowerCap.Powerful) {
    return Math.min(engramInfo.bonus, season.softCap - maxPower);
  } else if (engramInfo.cap === PowerCap.Pinnacle) {
    if (maxPower > season.softCap) {
      return Math.min(2, season.maxPower - maxPower);
    }
    return Math.min(engramInfo.bonus, season.softCap + 2 - maxPower);
  }
}
