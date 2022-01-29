import { DimItem } from 'app/inventory-stores/item-types';
import clsx from 'clsx';
import React from 'react';
import styles from './ItemCategoryIcon.m.scss';
import PressTip from './PressTip';
import {
  getArmorSlotSvgIcon,
  getWeaponSlotSvgIcon,
  getWeaponTypeSvgIcon,
} from './svgs/itemCategory';

export function ArmorSlotIcon({ item, className }: { item: DimItem; className?: string }) {
  return (
    <PressTip elementType="span" tooltip={item.typeName}>
      <img src={getArmorSlotSvgIcon(item)} className={clsx(styles.itemCategoryIcon, className)} />
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

export function WeaponTypeIcon({ item, className }: { item: DimItem; className?: string }) {
  return (
    <PressTip elementType="span" tooltip={item.typeName}>
      <img src={getWeaponTypeSvgIcon(item)} className={clsx(styles.itemCategoryIcon, className)} />
    </PressTip>
  );
}
