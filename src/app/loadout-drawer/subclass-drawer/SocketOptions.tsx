import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import styles from './SocketOptions.m.scss';
import { SelectedPlugs, SocketWithOptions } from './types';

export default function SocketOptions({
  socketsWithOptions,
  selectedPlugs,
  direction,
  onSelect,
  onRemove,
}: {
  socketsWithOptions: SocketWithOptions[];
  selectedPlugs: SelectedPlugs;
  direction: 'row' | 'column';
  onSelect?(option: DestinyInventoryItemDefinition): void;
  onRemove?(option: DestinyInventoryItemDefinition): void;
}) {
  return (
    <div className={styles.socketsWithOptions}>
      {socketsWithOptions.map(({ socket, options }) => (
        <div
          key={socket.plugged?.plugDef.itemTypeDisplayName}
          className={clsx(styles.options, { [styles.column]: direction === 'column' })}
        >
          {options.map((option) => (
            <Option
              key={option.hash}
              option={option}
              isSelected={plugIsSelected(selectedPlugs, option)}
              onSelect={() => onSelect?.(option)}
              onRemove={
                plugIsSelected(selectedPlugs, option) ? () => onRemove?.(option) : undefined
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function plugIsSelected(selectedPlugs: SelectedPlugs, option: DestinyInventoryItemDefinition) {
  return Boolean(
    isPluggableItem(option) && selectedPlugs[option.plug.plugCategoryHash]?.includes(option)
  );
}

export function Option({
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
        className={clsx('item', styles.option, { [styles.selected]: isSelected })}
        onClick={() => onSelect?.()}
      >
        <DefItemIcon itemDef={option} />
      </div>
    </ClosableContainer>
  );
}
