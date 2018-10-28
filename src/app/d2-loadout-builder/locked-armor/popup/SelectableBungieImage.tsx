import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import BungieImage from '../../../dim-ui/BungieImage';
import { LockedItemType } from '../../types';

export default function SelectableBungieImage({
  perk,
  selected,
  unselectable,
  onLockedPerk,
  onHoveredPerk
}: {
  perk: DestinyInventoryItemDefinition;
  selected: boolean;
  unselectable: boolean;
  onLockedPerk(perk: LockedItemType): void;
  onHoveredPerk(perk: {}): void;
}) {
  const isBadPerk = [
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
  ].includes(perk.hash);

  const handleClick = () => {
    if (unselectable) {
      return;
    }
    onLockedPerk({ type: 'perk', item: perk });
  };
  const handleHover = () => {
    onHoveredPerk(perk.displayProperties);
  };

  return (
    <BungieImage
      className={classNames('perk-image', {
        unselectable,
        'locked-perk': selected,
        'ammo-primary': perk.hash === 143442373,
        'ammo-special': perk.hash === 2620835322,
        'ammo-heavy': perk.hash === 2867719094,
        'good-perk': perk.hash === 1818103563,
        'bad-perk': isBadPerk
      })}
      title={`${perk.displayProperties.name}${isBadPerk ? t('LoadoutBuilder.BadPerk') : ''}${
        perk.hash === 1818103563 ? t('LoadoutBuilder.Traction') : ''
      }`}
      src={perk.displayProperties.icon}
      onClick={handleClick}
      onMouseEnter={handleHover}
    />
  );
}
