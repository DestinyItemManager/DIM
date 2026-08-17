import TagIcon from 'app/inventory/TagIcon';
import { AmmoIcon } from 'app/item-popup/AmmoIcon';
import { AppIcon, banIcon } from 'app/shell/icons';
import { VaultGroupIcon } from 'app/shell/item-comparators';
import BreakerType from './BreakerTypeIcon';
import ElementIcon from './ElementIcon';
import { getWeaponTypeSvgIconFromCategoryHashes } from './svgs/itemCategory';
import * as styles from './WeaponGroupingIcon.m.scss';

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
            <typeIcon.svg className={styles.weaponTypeIcon} />
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

    case 'breakerType': {
      return (
        <div className={className}>
          {icon.breakerType ? (
            <BreakerType className={styles.breakerTypeIcon} breakerType={icon.breakerType} />
          ) : (
            <AppIcon icon={banIcon} />
          )}
        </div>
      );
    }

    case 'none':
      return null;
  }
}
