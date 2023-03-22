import { DimItem } from 'app/inventory/item-types';
import clsx from 'clsx';
import styles from './ItemCategoryIcon.m.scss';
import { PressTip } from './PressTip';
import {
  getArmorSlotSvgIcon,
  getWeaponSlotSvgIcon,
  getWeaponTypeSvgIcon,
} from './svgs/itemCategory';

export function ArmorSlotIcon({
  item,
  className,
  wrapperClassName,
}: {
  item: DimItem;
  className?: string;
  wrapperClassName?: string;
}) {
  return (
    <PressTip minimal elementType="span" tooltip={item.typeName} className={wrapperClassName}>
      <img src={getArmorSlotSvgIcon(item)} className={clsx(styles.itemCategoryIcon, className)} />
    </PressTip>
  );
}

export function WeaponSlotIcon({
  item,
  className,
  wrapperClassName,
}: {
  item: DimItem;
  className?: string;
  wrapperClassName?: string;
}) {
  return (
    <PressTip minimal elementType="span" tooltip={item.bucket.name} className={wrapperClassName}>
      <img
        src={getWeaponSlotSvgIcon(item)}
        className={clsx(styles.itemCategoryIcon, styles.dontInvert, className)}
      />
    </PressTip>
  );
}

export function WeaponTypeIcon({
  item,
  className,
  wrapperClassName,
}: {
  item: DimItem;
  className?: string;
  wrapperClassName?: string;
}) {
  return (
    <PressTip minimal elementType="span" tooltip={item.typeName} className={wrapperClassName}>
      <img src={getWeaponTypeSvgIcon(item)} className={clsx(styles.itemCategoryIcon, className)} />
    </PressTip>
  );
}
