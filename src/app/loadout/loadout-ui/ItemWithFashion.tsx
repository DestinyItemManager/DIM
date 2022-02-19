import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { useD2Definitions } from 'app/manifest/selectors';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import clsx from 'clsx';
import { PlugCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import styles from './ItemWithFashion.m.scss';

export default function ItemWithFashion({
  item,
  applyFashion,
  modsForBucket,
  onDoubleClick,
  onMissingItemClick,
}: {
  item: DimItem;
  applyFashion: boolean;
  modsForBucket: number[];
  onDoubleClick?(): void;
  onMissingItemClick?(): void;
}) {
  const defs = useD2Definitions();
  let ornament: PluggableInventoryItemDefinition | undefined;

  if (applyFashion) {
    const cosmeticSockets = getSocketsByCategoryHash(
      item.sockets,
      SocketCategoryHashes.ArmorCosmetics
    );

    for (const modHash of modsForBucket) {
      const plugDef = defs?.InventoryItem.get(modHash);
      const isDefaultPlug =
        cosmeticSockets.find((s) => s.plugSet?.plugs.some((p) => p.plugDef.hash === modHash))
          ?.socketDefinition.singleInitialItemHash === modHash;
      if (
        !isDefaultPlug &&
        plugDef?.plug?.plugCategoryHash !== PlugCategoryHashes.Shader &&
        isPluggableItem(plugDef)
      ) {
        ornament = plugDef;
      }
    }
  }

  return (
    <ItemPopupTrigger item={item}>
      {(ref, onClick) => (
        <div
          className={clsx({
            [styles.missingItem]: item.owner === 'unknown',
          })}
        >
          <ConnectedInventoryItem
            item={item}
            innerRef={ref}
            ornament={ornament}
            onClick={!onMissingItemClick || item.owner !== 'unknown' ? onClick : onMissingItemClick}
            onDoubleClick={onDoubleClick}
          />
        </div>
      )}
    </ItemPopupTrigger>
  );
}
