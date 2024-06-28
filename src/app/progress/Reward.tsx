import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { DimStore } from 'app/inventory/store-types';
import { dropPowerLevelSelector } from 'app/inventory/store/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import { useSelector } from 'react-redux';
import BungieImage from '../dim-ui/BungieImage';
import styles from './Reward.m.scss';
import { getEngramPowerBonus } from './engrams';
import { getXPValue } from './xp';

export function Reward({
  reward,
  store,
  itemHash,
}: {
  reward: DestinyItemQuantity;
  // If provided, will help make engram bonuses more accurate
  store?: DimStore;
  // If provided, will help make engram bonuses more accurate
  itemHash?: number;
}) {
  const defs = useD2Definitions()!;
  const dropPower = useSelector(dropPowerLevelSelector(store?.id));
  const [powerBonus, rewardItemHash] = getEngramPowerBonus(reward.itemHash, dropPower, itemHash);
  const rewardItem = defs.InventoryItem.get(rewardItemHash);
  const rewardDisplay = rewardItem.displayProperties;

  const xpValue = getXPValue(reward.itemHash);

  return (
    <div className={styles.reward}>
      <BungieImage src={rewardDisplay.icon} alt="" />
      <span>
        {powerBonus !== undefined && `+${powerBonus} `}
        <RichDestinyText text={rewardDisplay.name} ownerId={store?.id} />
        {reward.quantity > 1 && ` +${reward.quantity.toLocaleString()}`}
        {xpValue !== undefined && ` (${xpValue.toLocaleString()} XP)`}
      </span>
    </div>
  );
}
