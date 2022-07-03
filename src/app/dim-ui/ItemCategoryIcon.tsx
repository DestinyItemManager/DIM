import { DimItem } from 'app/inventory/item-types';
import clsx from 'clsx';
import kineticSlot from 'images/kinetic-slot.svg';
import styles from './ItemCategoryIcon.m.scss';
import PressTip from './PressTip';
import {
  getArmorSlotSvgIcon,
  getWeaponSlotSvgIcon,
  getWeaponTypeSvgIcon,
} from './svgs/itemCategory';

export function ArmorSlotIcon({ item, className }: { item: DimItem; className?: string }) {
  return (
    <PressTip minimal elementType="span" tooltip={item.typeName}>
      <img src={getArmorSlotSvgIcon(item)} className={clsx(styles.itemCategoryIcon, className)} />
    </PressTip>
  );
}

// don't invert these. they're perfect as-is.
const imagesToLeaveAlone = [kineticSlot];

export function WeaponSlotIcon({ item, className }: { item: DimItem; className?: string }) {
  const slotIcon = getWeaponSlotSvgIcon(item)!;
  return (
    <PressTip minimal elementType="span" tooltip={item.bucket.name}>
      <img
        src={slotIcon}
        className={clsx(styles.itemCategoryIcon, className, {
          [styles.dontInvert]: imagesToLeaveAlone.includes(slotIcon),
        })}
      />
    </PressTip>
  );
}

export function WeaponTypeIcon({ item, className }: { item: DimItem; className?: string }) {
  return (
    <PressTip minimal elementType="span" tooltip={item.typeName}>
      <img src={getWeaponTypeSvgIcon(item)} className={clsx(styles.itemCategoryIcon, className)} />
    </PressTip>
  );
}
