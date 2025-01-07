import TagIcon from 'app/inventory/TagIcon';
import { AmmoIcon } from 'app/item-popup/AmmoIcon';
import { VaultGroupIcon } from 'app/shell/item-comparators';
import ElementIcon from './ElementIcon';
import { getWeaponTypeSvgIconFromCategoryHashes } from './svgs/itemCategory';
import styles from './WeaponGroupingIcon.m.scss';

export default function WeaponGroupingIcon({
  icon,
  className,
}: {
  icon: VaultGroupIcon;
  className?: string;
}) {
  switch (icon.type) {
    case 'typeName': {
      const typeIcon = getWeaponTypeSvgIconFromCategoryHashes(icon.itemCategoryHashes);
      return (
        typeIcon && (
          <div className={className}>
            <img src={typeIcon.svg} className={styles.weaponTypeIcon} />
          </div>
        )
      );
    }

    case 'ammoType': {
      return (
        <div className={className}>
          <AmmoIcon type={icon.ammoType} className={styles.ammoIcon} />
        </div>
      );
    }

    case 'tag': {
      return (
        icon.tag && (
          <div className={className}>
            <TagIcon tag={icon.tag} />
          </div>
        )
      );
    }

    case 'elementWeapon': {
      return (
        <div className={className}>
          <ElementIcon className={styles.elementIcon} element={icon.element} />
        </div>
      );
    }

    case 'none':
      return null;
  }
}
