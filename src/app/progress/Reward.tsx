import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { DimStore } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import { getEngramPowerBonus } from './engrams';
import styles from './Reward.m.scss';

export function Reward({
  reward,
  store,
}: {
  reward: DestinyItemQuantity;
  // If provided, will help make engram bonuses more accurate
  store?: DimStore;
}) {
  const defs = useD2Definitions()!;
  const rewardItem = defs.InventoryItem.get(reward.itemHash);
  const rewardDisplay = rewardItem.displayProperties;

  const powerBonus = getEngramPowerBonus(rewardItem.hash, store?.stats.maxGearPower?.value);

  return (
    <div className={styles.reward}>
      <BungieImage src={rewardDisplay.icon} alt="" />
      <span>
        {powerBonus !== undefined && `+${powerBonus} `}
        <RichDestinyText text={rewardDisplay.name} ownerId={store?.id} />
        {reward.quantity > 1 && ` +${reward.quantity.toLocaleString()}`}
      </span>
    </div>
  );
}
