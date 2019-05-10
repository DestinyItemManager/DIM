import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import { t } from 'app/i18next-t';
import React from 'react';
import { LockedItemType, BurnItem } from '../../types';
import BungieImageAndAmmo from '../../../dim-ui/BungieImageAndAmmo';
import styles from './SelectableBungieImage.m.scss';

const badPerk = new Set([
  3201772785, // power weapon targeting
  351326616, // energy weapon targeting
  2839066781, // kinetic weapon targeting
  4255886137, // power weapon loader
  182444936, // energy weapon loader
  4043093993, // kinetic weapon loader
  3647557929, // unflinching large arms
  1204062917, // unflinching power aim
  2317587052, // unflinching energy aim
  527286589, // unflinching kinetic aim
  952165152, // power dexterity
  377666359, // energy dexterity
  2326218464 // kinetic dexterity
]);

export default function SelectableBungieImage({
  perk,
  selected,
  unselectable,
  onLockedPerk
}: {
  perk: DestinyInventoryItemDefinition;
  selected: boolean;
  unselectable: boolean;
  onLockedPerk(perk: LockedItemType): void;
}) {
  const isBadPerk = badPerk.has(perk.hash);

  const handleClick = (e) => {
    e.preventDefault();
    if (unselectable) {
      return;
    }
    onLockedPerk({ type: 'perk', item: perk });
  };

  return (
    <div className={styles.perk} onClick={handleClick} role="button" tabIndex={0}>
      <BungieImageAndAmmo
        className={classNames({
          [styles.unselectable]: unselectable,
          [styles.lockedPerk]: selected,
          [styles.goodPerk]: perk.hash === 1818103563,
          [styles.badPerk]: isBadPerk
        })}
        hash={perk.hash}
        alt=""
        src={perk.displayProperties.icon}
      />
      <div className={styles.perkInfo}>
        <div className={styles.perkTitle}>{perk.displayProperties.name}</div>
        <div className={styles.perkDescription}>
          {perk.displayProperties.description}
          {isBadPerk && <p>{t('LoadoutBuilder.BadPerk')}</p>}
          {perk.hash === 1818103563 && t('LoadoutBuilder.Traction')}
        </div>
      </div>
    </div>
  );
}

export function SelectableBurn({
  burn,
  selected,
  onLockedPerk
}: {
  burn: BurnItem;
  selected: boolean;
  onLockedPerk(burn: LockedItemType): void;
}) {
  const handleClick = () => {
    onLockedPerk({ type: 'burn', item: burn });
  };

  return (
    <div className={styles.perk} onClick={handleClick} role="button" tabIndex={0}>
      <img
        className={classNames(`perk-image ${burn.index}`, {
          [styles.lockedPerk]: selected
        })}
        alt=""
        src={burn.displayProperties.icon}
      />
      <div className={styles.perkInfo}>
        <div className={styles.perkTitle}>{burn.displayProperties.name}</div>
      </div>
    </div>
  );
}
