import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { vaultWeaponGroupingSettingSelector } from 'app/settings/vault-grouping';
import { AppIcon, archiveIcon, banIcon, boltIcon, heartIcon, tagIcon } from 'app/shell/icons';
import { VaultGroupValue } from 'app/shell/item-comparators';
import { useSelector } from 'react-redux';

const ICON_MAP: Partial<Record<string, Partial<Record<string, string | IconDefinition>>>> = {
  typeName: {},
  rarity: {},
  ammoType: {},
  tag: {
    favorite: heartIcon,
    keep: tagIcon,
    junk: banIcon,
    infuse: boltIcon,
    archive: archiveIcon,
  },
  elementWeapon: {},
};

export default function WeaponGroupingIcon({
  groupValue,
  className,
}: {
  groupValue: VaultGroupValue;
  className?: string;
}) {
  const vaultWeaponGroupingSetting = useSelector(vaultWeaponGroupingSettingSelector);

  if (!vaultWeaponGroupingSetting || typeof groupValue === 'undefined') {
    return null;
  }

  const icon = ICON_MAP[vaultWeaponGroupingSetting]?.[groupValue.toString()];

  if (!icon) {
    return null;
  }

  return (
    <div className={className}>
      <AppIcon icon={icon} />
    </div>
  );
}
