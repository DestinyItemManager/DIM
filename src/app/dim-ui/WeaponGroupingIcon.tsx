import TagIcon from 'app/inventory/TagIcon';
import { AmmoIcon } from 'app/item-popup/ItemPopupHeader';
import { VaultGroupIcon } from 'app/shell/item-comparators';
import ElementIcon from './ElementIcon';
import { getWeaponTypeSvgIconFromCategoryHashes } from './svgs/itemCategory';

export default function WeaponGroupingIcon({
  icon,
  className,
}: {
  icon: VaultGroupIcon;
  className?: string;
}) {
  if (icon.type === 'none') {
    return null;
  }

  if (icon.type === 'typeName') {
    const typeIcon = getWeaponTypeSvgIconFromCategoryHashes(icon.itemCategoryHashes);

    if (!typeIcon) {
      return null;
    }

    return (
      <div className={className}>
        <img src={typeIcon.svg} className="weapon-type-icon" />
      </div>
    );
  }

  if (icon.type === 'ammoType') {
    return (
      <div className={className}>
        <AmmoIcon type={icon.ammoType} className="ammo-icon" />
      </div>
    );
  }

  if (icon.type === 'tag') {
    if (icon.tag === undefined) {
      return null;
    }

    return (
      <div className={className}>
        <TagIcon tag={icon.tag} />
      </div>
    );
  }

  if (icon.type === 'elementWeapon') {
    return (
      <div className={className}>
        <ElementIcon className="element-icon" element={icon.element} />
      </div>
    );
  }

  return null;
}
