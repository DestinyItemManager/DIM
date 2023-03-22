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
  const icon = getArmorSlotSvgIcon(item);
  return icon ? (
    <PressTip minimal elementType="span" tooltip={item.typeName} className={wrapperClassName}>
      <img src={icon.svg} className={clsx(styles.itemCategoryIcon, className)} />
    </PressTip>
  ) : (
    <>{item.typeName}</>
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
  const icon = getWeaponSlotSvgIcon(item);
  return icon ? (
    <PressTip minimal elementType="span" tooltip={item.bucket.name} className={wrapperClassName}>
      <img src={icon.svg} className={clsx(styles.itemCategoryIcon, styles.dontInvert, className)} />
    </PressTip>
  ) : (
    <>{item.bucket.name}</>
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
  const icon = getWeaponTypeSvgIcon(item);
  return icon ? (
    <PressTip minimal elementType="span" tooltip={item.typeName} className={wrapperClassName}>
      <img src={icon.svg} className={clsx(styles.itemCategoryIcon, className)} />
    </PressTip>
  ) : (
    <>{item.typeName}</>
  );
}
