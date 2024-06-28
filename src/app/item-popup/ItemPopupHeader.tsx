import ArmorySheet from 'app/armory/ArmorySheet';
import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { D1BucketHashes } from 'app/search/d1-known-values';
import type { ItemTierName } from 'app/search/d2-known-values';
import { LookupTable } from 'app/utils/util-types';
import { DestinyAmmunitionType, DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import heavy from 'destiny-icons/general/ammo-heavy.svg';
import primary from 'destiny-icons/general/ammo-primary.svg';
import special from 'destiny-icons/general/ammo-special.svg';
import { useState } from 'react';
import { DimItem } from '../inventory/item-types';
import styles from './ItemPopupHeader.m.scss';

const tierClassName: LookupTable<ItemTierName, string> = {
  Common: styles.common,
  Uncommon: styles.uncommon,
  Rare: styles.rare,
  Legendary: styles.legendary,
  Exotic: styles.exotic,
};

export default function ItemPopupHeader({
  item,
  noLink,
}: {
  item: DimItem;
  /** Don't allow opening Armory from the header link */
  noLink?: boolean;
}) {
  const [showArmory, setShowArmory] = useState(false);
  useHotkey('a', t('Hotkey.Armory'), () => setShowArmory(true));

  const showElementIcon = Boolean(item.element);

  const linkToArmory = !noLink && item.destinyVersion === 2;

  return (
    <button
      type="button"
      disabled={!linkToArmory}
      className={clsx(styles.header, tierClassName[item.tier], {
        [styles.masterwork]: item.masterwork,
        [styles.pursuit]: item.pursuit,
        [styles.armory]: linkToArmory,
      })}
      title={linkToArmory ? `${t('Hotkey.Armory')} [A]` : undefined}
      aria-keyshortcuts={linkToArmory ? 'a' : undefined}
      onClick={() => setShowArmory(true)}
    >
      {!linkToArmory ? (
        <span className={styles.title}>{item.name}</span>
      ) : (
        <h1 className={styles.title}>
          <RichDestinyText text={item.name} ownerId={item.owner} />
        </h1>
      )}

      <div className={styles.subtitle}>
        <div className={styles.type}>
          <ItemTypeName item={item} className={styles.itemType} />
          {item.destinyVersion === 2 && item.ammoType > 0 && <AmmoIcon type={item.ammoType} />}
          {item.breakerType && (
            <BungieImage
              className={styles.breakerIcon}
              src={item.breakerType.displayProperties.icon}
            />
          )}
        </div>

        <div className={styles.details}>
          {showElementIcon && <ElementIcon element={item.element} className={styles.elementIcon} />}
          <div className={styles.power}>{item.primaryStat?.value}</div>
          {item.maxStackSize > 1 &&
            !item.itemCategoryHashes.includes(ItemCategoryHashes.Mods_Ornament) && (
              <div className={styles.itemType}>
                {item.amount.toLocaleString()} / {item.maxStackSize.toLocaleString()}
              </div>
            )}
          {item.pursuit?.questLine && (
            <div className={styles.itemType}>
              {t('MovePopup.Subtitle.QuestProgress', {
                questStepNum: item.pursuit.questLine.questStepNum,
                questStepsTotal: item.pursuit.questLine.questStepsTotal,
              })}
            </div>
          )}
        </div>
      </div>
      {showArmory && linkToArmory && (
        <ArmorySheet onClose={() => setShowArmory(false)} item={item} />
      )}
    </button>
  );
}

const ammoIcons: LookupTable<DestinyAmmunitionType, string> = {
  [DestinyAmmunitionType.Primary]: primary,
  [DestinyAmmunitionType.Special]: special,
  [DestinyAmmunitionType.Heavy]: heavy,
};

export function AmmoIcon({ type, className }: { type: DestinyAmmunitionType; className?: string }) {
  return (
    <img
      className={clsx(
        styles.ammoIcon,
        {
          [styles.primary]: type === DestinyAmmunitionType.Primary,
        },
        className,
      )}
      src={ammoIcons[type]}
    />
  );
}

export function ItemTypeName({ item, className }: { item: DimItem; className?: string }) {
  const classType =
    (item.classType !== DestinyClass.Unknown &&
      // These already include the class name
      item.bucket.hash !== BucketHashes.ClassArmor &&
      item.bucket.hash !== D1BucketHashes.Artifact &&
      item.bucket.hash !== BucketHashes.Subclass &&
      !item.classified &&
      item.classTypeNameLocalized[0].toUpperCase() + item.classTypeNameLocalized.slice(1)) ||
    '';

  const title =
    item.typeName && classType
      ? t('MovePopup.Subtitle.Type', {
          classType,
          typeName: item.typeName,
        })
      : item.typeName || classType;

  if (!title) {
    return null;
  }

  return <div className={className}>{title}</div>;
}
