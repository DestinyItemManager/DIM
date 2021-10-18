import ArmorySheet from 'app/armory/ArmorySheet';
import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { t } from 'app/i18next-t';
import { DamageType, DestinyAmmunitionType, DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import heavy from 'destiny-icons/general/ammo_heavy.svg';
import primary from 'destiny-icons/general/ammo_primary.svg';
import special from 'destiny-icons/general/ammo_special.svg';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { DimItem } from '../inventory/item-types';
import styles from './ItemPopupHeader.m.scss';

const tierClassName = {
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

  return (
    <div
      className={clsx(styles.header, tierClassName[item.tier], {
        [styles.masterwork]: item.masterwork,
        [styles.pursuit]: item.pursuit,
      })}
    >
      {noLink || item.destinyVersion === 1 ? (
        <span className={styles.title}>{item.name}</span>
      ) : (
        <a className={styles.title} onClick={() => setShowArmory(true)}>
          {item.name}
        </a>
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
          {item.element &&
            !(item.bucket.inWeapons && item.element.enumValue === DamageType.Kinetic) && (
              <ElementIcon element={item.element} className={styles.elementIcon} />
            )}
          <div className={styles.power}>{item.primStat?.value}</div>
          {item.powerCap && <div className={styles.powerCap}>| {item.powerCap} </div>}
          {item.pursuit?.questStepNum && (
            <div className={styles.itemType}>
              {t('MovePopup.Subtitle.QuestProgress', {
                questStepNum: item.pursuit.questStepNum,
                questStepsTotal: item.pursuit.questStepsTotal,
              })}
            </div>
          )}
        </div>
      </div>
      {showArmory &&
        ReactDOM.createPortal(
          <ArmorySheet onClose={() => setShowArmory(false)} item={item} />,
          document.body
        )}
    </div>
  );
}

const ammoIcons = {
  [DestinyAmmunitionType.Primary]: primary,
  [DestinyAmmunitionType.Special]: special,
  [DestinyAmmunitionType.Heavy]: heavy,
};

export function AmmoIcon({ type }: { type: DestinyAmmunitionType }) {
  return (
    <img
      className={clsx(styles.ammoIcon, {
        [styles.primary]: type === DestinyAmmunitionType.Primary,
      })}
      src={ammoIcons[type]}
    />
  );
}

export function ItemTypeName({ item, className }: { item: DimItem; className?: string }) {
  const classType =
    (item.classType !== DestinyClass.Unknown &&
      // These already include the class name
      item.type !== 'ClassItem' &&
      item.type !== 'Artifact' &&
      item.type !== 'Class' &&
      !item.classified &&
      item.classTypeNameLocalized[0].toUpperCase() + item.classTypeNameLocalized.slice(1)) ||
    '';

  if (!(item.typeName || classType)) {
    return null;
  }

  return (
    <div className={className}>
      {t('MovePopup.Subtitle.Type', {
        classType,
        typeName: item.typeName,
      })}
    </div>
  );
}
