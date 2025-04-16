import ClassIcon from 'app/dim-ui/ClassIcon';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';
import styles from './LoadoutDrawerItem.m.scss';

export default function LoadoutDrawerItem({
  resolvedLoadoutItem,
  equip,
  remove,
}: {
  resolvedLoadoutItem: ResolvedLoadoutItem;
  equip: (resolvedItem: ResolvedLoadoutItem, e: React.MouseEvent) => void;
  remove: (resolvedItem: ResolvedLoadoutItem, e: React.MouseEvent) => void;
}) {
  const onClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    remove(resolvedLoadoutItem, e);
  };

  const { item } = resolvedLoadoutItem;

  return (
    <ClosableContainer onClose={onClose}>
      <ConnectedInventoryItem item={item} onClick={(e) => equip(resolvedLoadoutItem, e)} />
      {item.bucket.hash === BucketHashes.Subclass && (
        <ClassIcon classType={item.classType} className={styles.classIcon} />
      )}
    </ClosableContainer>
  );
}
