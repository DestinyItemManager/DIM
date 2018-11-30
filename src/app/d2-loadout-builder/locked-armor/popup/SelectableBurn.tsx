import * as classNames from 'classnames';
import * as React from 'react';
import { LockedItemType, BurnItem } from '../../types';

export default function SelectableBurn({
  burn,
  selected,
  onLockedPerk,
  onHoveredPerk
}: {
  burn: BurnItem;
  selected: boolean;
  onLockedPerk(burn: LockedItemType): void;
  onHoveredPerk(burn: {}): void;
}) {
  const handleClick = () => {
    onLockedPerk({ type: 'burn', item: burn });
  };
  const handleHover = () => {
    onHoveredPerk(burn.displayProperties);
  };

  return (
    <img
      className={classNames(`perk-image ${burn.index}`, {
        'locked-perk': selected
      })}
      title={burn.displayProperties.name}
      onClick={handleClick}
      onMouseEnter={handleHover}
      src={burn.displayProperties.icon}
    />
  );
}
