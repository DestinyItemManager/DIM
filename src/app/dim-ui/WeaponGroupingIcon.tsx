import { TagValue } from '@destinyitemmanager/dim-api-types';
import { D1DamageTypeDefinition } from 'app/destiny1/d1-manifest-types';
import TagIcon from 'app/inventory/TagIcon';
import { toD2DamageType } from 'app/inventory/store/d1-item-factory';
import { AmmoIcon } from 'app/item-popup/ItemPopupHeader';
import { useDefinitions } from 'app/manifest/selectors';
import { vaultWeaponGroupingSettingSelector } from 'app/settings/vault-grouping';
import { VaultGroupValue } from 'app/shell/item-comparators';
import {
  DamageType,
  DestinyAmmunitionType,
  DestinyDamageTypeDefinition,
} from 'bungie-api-ts/destiny2';
import { useSelector } from 'react-redux';
import ElementIcon from './ElementIcon';

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

const VALID_ELEMENTS: Record<DamageType, boolean> = {
  [DamageType.None]: true,
  [DamageType.Kinetic]: true,
  [DamageType.Arc]: true,
  [DamageType.Thermal]: true,
  [DamageType.Void]: true,
  [DamageType.Raid]: true,
  [DamageType.Stasis]: true,
  [DamageType.Strand]: true,
};

const toInitials = (input: string) =>
  input
    .replace(/\W+/gi, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase())
    .join('');

export default function WeaponGroupingIcon({
  groupValue,
  className,
}: {
  groupValue: VaultGroupValue;
  className?: string;
}) {
  const defs = useDefinitions();
  const vaultWeaponGroupingSetting = useSelector(vaultWeaponGroupingSettingSelector);

  if (!vaultWeaponGroupingSetting || typeof groupValue === 'undefined') {
    return null;
  }

  if (vaultWeaponGroupingSetting === 'typeName' && typeof groupValue === 'string') {
    return <div className={className}>{toInitials(groupValue)}</div>;
  }

  if (vaultWeaponGroupingSetting === 'rarity') {
    // Rarity is fairly obvious from the colors, so we don't need to show an icon
    return null;
  }

  if (
    vaultWeaponGroupingSetting === 'ammoType' &&
    typeof groupValue === 'number' &&
    groupValue in VALID_AMMO_TYPES
  ) {
    return (
      <div className={className}>
        <AmmoIcon type={groupValue} />
      </div>
    );
  }

  if (
    vaultWeaponGroupingSetting === 'tag' &&
    typeof groupValue === 'string' &&
    groupValue in VALID_TAGS
  ) {
    return (
      <div className={className}>
        <TagIcon tag={groupValue as TagValue} />
      </div>
    );
  }

  if (
    vaultWeaponGroupingSetting === 'elementWeapon' &&
    typeof groupValue === 'number' &&
    groupValue in VALID_ELEMENTS
  ) {
    const manifestDamageTypeMapping: Record<
      number,
      D1DamageTypeDefinition | DestinyDamageTypeDefinition
    > = defs?.DamageType.getAll() ?? {};
    const elementTypeDefs = Object.values(manifestDamageTypeMapping);
    const element = elementTypeDefs.find((def) => def.enumValue === groupValue);
    const convertedElement =
      element && 'damageTypeHash' in element ? toD2DamageType(element) : element;

    if (convertedElement) {
      return (
        <div className={className}>
          <ElementIcon className="element-icon" element={convertedElement} />
        </div>
      );
    }
  }

  return null;
}
