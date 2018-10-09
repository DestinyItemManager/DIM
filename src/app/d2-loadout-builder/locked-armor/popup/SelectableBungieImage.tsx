import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as classNames from 'classnames';
import * as React from 'react';
import BungieImage from '../../../dim-ui/BungieImage';

export default function SelectableBungieImage({
  perk,
  selected,
  onLockedPerk,
  onHoveredPerk
}: {
  perk: DestinyInventoryItemDefinition;
  selected: boolean;
  onLockedPerk(perk: DestinyInventoryItemDefinition): void;
  onHoveredPerk(perk: {}): void;
}) {
  const handleClick = () => {
    onLockedPerk(perk);
  };
  const handleHover = () => {
    onHoveredPerk(perk.displayProperties);
  };

  return (
    <BungieImage
      className={classNames('perk-image', {
        'locked-perk': selected,
        'ammo-primary': perk.hash === 143442373,
        'ammo-special': perk.hash === 2620835322,
        'ammo-heavy': perk.hash === 2867719094
      })}
      title={perk.displayProperties.name}
      src={perk.displayProperties.icon}
      onClick={handleClick}
      onMouseEnter={handleHover}
    />
  );
}
