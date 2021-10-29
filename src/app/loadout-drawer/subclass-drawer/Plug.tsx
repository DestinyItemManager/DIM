import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import styles from './Plug.m.scss';

export default function Plug({
  plug,
  isSelected,
  onSelect,
  onRemove,
}: {
  plug: DestinyInventoryItemDefinition;
  isSelected: boolean;
  onSelect?(): void;
  onRemove?(): void;
}) {
  return (
    <ClosableContainer
      key={plug.hash}
      showCloseIconOnHover={true}
      enabled={Boolean(onRemove)}
      onClose={() => onRemove?.()}
    >
      <div
        role="button"
        title={plug.displayProperties.name}
        className={clsx('item', styles.plug, { [styles.selected]: isSelected })}
        onClick={() => onSelect?.()}
      >
        <DefItemIcon itemDef={plug} />
      </div>
    </ClosableContainer>
  );
}
