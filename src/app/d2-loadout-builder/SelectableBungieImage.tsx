import * as React from 'react';
import * as classNames from 'classnames';
import BungieImage from '../dim-ui/BungieImage';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';

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
        'locked-perk': selected
      })}
      title={perk.displayProperties.name}
      src={perk.displayProperties.icon}
      onClick={handleClick}
      onMouseEnter={handleHover}
    />
  );
}
