import { DimItem } from 'app/inventory/item-types';
import clsx from 'clsx';
import React from 'react';
import styles from './ItemCategoryIcon.m.scss';
import PressTip from './PressTip';
import { getItemSvgIcon, getWeaponSlotSvgIcon } from './svgs/itemCategory';

export function ItemCategoryIcon({ item, className }: { item: DimItem; className?: string }) {
  return (
    <PressTip elementType="span" tooltip={item.typeName}>
      <img src={getItemSvgIcon(item)} className={clsx(styles.itemCategoryIcon, className)} />
    </PressTip>
  );
}
export function WeaponSlotIcon({ item, className }: { item: DimItem; className?: string }) {
  return (
    <PressTip elementType="span" tooltip={item.bucket.name}>
      <img src={getWeaponSlotSvgIcon(item)} className={clsx(styles.itemCategoryIcon, className)} />
    </PressTip>
  );
}
