import { DimItem } from 'app/inventory/item-types';
import clsx from 'clsx';
import styles from './ItemCategoryIcon.m.scss';
import { PressTip } from './PressTip';
import {
  getArmorSlotSvgIcon,
  getWeaponSlotSvgIcon,
  getWeaponTypeSvgIcon,
} from './svgs/itemCategory';

export function ArmorSlotIcon({ item, className }: { item: DimItem; className?: string }) {
  const icon = getArmorSlotSvgIcon(item);
  return icon ? (
    <PressTip minimal elementType="span" tooltip={item.typeName} className={className}>
      <img src={icon.svg} className={styles.itemCategoryIcon} />
    </PressTip>
  ) : (
    <>{item.typeName}</>
  );
}

export function WeaponSlotIcon({ item, className }: { item: DimItem; className?: string }) {
  const icon = getWeaponSlotSvgIcon(item);
  return icon ? (
    <PressTip minimal elementType="span" tooltip={item.bucket.name} className={className}>
      <img src={icon.svg} className={clsx(styles.itemCategoryIcon, 'dontInvert')} />
    </PressTip>
  ) : (
    <>{item.bucket.name}</>
  );
}

export function WeaponTypeIcon({ item, className }: { item: DimItem; className?: string }) {
  const icon = getWeaponTypeSvgIcon(item);
  return icon ? (
    <PressTip minimal elementType="span" tooltip={item.typeName} className={className}>
      <img src={icon.svg} className={styles.itemCategoryIcon} />
    </PressTip>
  ) : (
    <>{item.typeName}</>
  );
}
