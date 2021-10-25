import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import styles from './Option.m.scss';

export default function Option({
  option,
  isSelected,
  onSelect,
  onRemove,
}: {
  option: DestinyInventoryItemDefinition;
  isSelected: boolean;
  onSelect?(): void;
  onRemove?(): void;
}) {
  return (
    <ClosableContainer
      key={option.hash}
      showCloseIconOnHover={true}
      enabled={Boolean(onRemove)}
      onClose={() => onRemove?.()}
    >
      <div
        role="button"
        title={option.displayProperties.name}
        className={clsx('item', styles.option, { [styles.selected]: isSelected })}
        onClick={() => onSelect?.()}
      >
        <DefItemIcon itemDef={option} />
      </div>
    </ClosableContainer>
  );
}
