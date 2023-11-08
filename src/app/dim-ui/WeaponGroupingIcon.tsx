import { TagValue } from '@destinyitemmanager/dim-api-types';
import TagIcon from 'app/inventory/TagIcon';
import { AmmoIcon } from 'app/item-popup/ItemPopupHeader';
import { vaultWeaponGroupingSettingSelector } from 'app/settings/vault-grouping';
import { VaultGroupIconValue } from 'app/shell/item-comparators';
import { DestinyAmmunitionType } from 'bungie-api-ts/destiny2';
import { useSelector } from 'react-redux';
import ElementIcon from './ElementIcon';
import { getWeaponTypeSvgIconFromCategoryHashes } from './svgs/itemCategory';

const VALID_AMMO_TYPES: Record<DestinyAmmunitionType, boolean> = {
  [DestinyAmmunitionType.None]: true,
  [DestinyAmmunitionType.Primary]: true,
  [DestinyAmmunitionType.Special]: true,
  [DestinyAmmunitionType.Heavy]: true,
  [DestinyAmmunitionType.Unknown]: true,
};

const VALID_TAGS: Record<TagValue, boolean> = {
  favorite: true,
  keep: true,
  infuse: true,
  archive: true,
  junk: true,
};

export default function WeaponGroupingIcon({
  iconValue,
  className,
}: {
  iconValue: VaultGroupIconValue;
  className?: string;
}) {
  const vaultWeaponGroupingSetting = useSelector(vaultWeaponGroupingSettingSelector);

  if (!vaultWeaponGroupingSetting || typeof iconValue === 'undefined') {
    return null;
  }

  if (
    vaultWeaponGroupingSetting === 'typeName' &&
    typeof iconValue === 'object' &&
    // eslint-disable-next-line no-implicit-coercion
    !!iconValue &&
    !('hash' in iconValue)
  ) {
    const icon = getWeaponTypeSvgIconFromCategoryHashes(iconValue);

    if (!icon) {
      return null;
    }

    return (
      <div className={className}>
        <img src={icon.svg} className="weapon-type-icon" />
      </div>
    );
  }

  if (vaultWeaponGroupingSetting === 'rarity') {
    // Rarity is fairly obvious from the colors, so we don't need to show an icon
    return null;
  }

  if (
    vaultWeaponGroupingSetting === 'ammoType' &&
    typeof iconValue === 'number' &&
    iconValue in VALID_AMMO_TYPES
  ) {
    return (
      <div className={className}>
        <AmmoIcon type={iconValue} className="ammo-icon" />
      </div>
    );
  }

  if (
    vaultWeaponGroupingSetting === 'tag' &&
    typeof iconValue === 'string' &&
    iconValue in VALID_TAGS
  ) {
    return (
      <div className={className}>
        <TagIcon tag={iconValue} />
      </div>
    );
  }

  if (
    vaultWeaponGroupingSetting === 'elementWeapon' &&
    typeof iconValue === 'object' &&
    // eslint-disable-next-line no-implicit-coercion
    !!iconValue &&
    'hash' in iconValue
  ) {
    return (
      <div className={className}>
        <ElementIcon className="element-icon" element={iconValue} />
      </div>
    );
  }

  return null;
}
