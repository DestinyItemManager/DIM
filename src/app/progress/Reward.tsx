import React from 'react';

import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import styles from './Reward.m.scss';

export function Reward({
  reward,
  defs,
}: {
  reward: DestinyItemQuantity;
  defs: D2ManifestDefinitions;
}) {
  const rewardDisplay = defs.InventoryItem.get(reward.itemHash).displayProperties;

  return (
    <div className={styles.reward}>
      <BungieImage src={rewardDisplay.icon} alt="" />
      <span>
        {rewardDisplay.name}
        {reward.quantity > 1 && ` +${reward.quantity.toLocaleString()}`}
      </span>
    </div>
  );
}
