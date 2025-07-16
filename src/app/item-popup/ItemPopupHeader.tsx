import ArmorySheet from 'app/armory/ArmorySheet';
import { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import type { ItemRarityName } from 'app/search/d2-known-values';
import { itemTypeName } from 'app/utils/item-utils';
import { LookupTable } from 'app/utils/util-types';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import { useState } from 'react';
import { DimItem } from '../inventory/item-types';
import { AmmoIcon } from './AmmoIcon';
import BreakerType from './BreakerType';
import styles from './ItemPopupHeader.m.scss';

const rarityClassName: LookupTable<ItemRarityName, string> = {
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
      className={clsx(styles.header, rarityClassName[item.rarity], {
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
          <div className={styles.itemType}>{itemTypeName(item)}</div>
          {item.destinyVersion === 2 && item.ammoType > 0 && <AmmoIcon type={item.ammoType} />}
          <BreakerType item={item} />
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
      {item.iconOverlay && (
        <div className={styles.iconOverlay} style={bungieBackgroundStyle(item.iconOverlay)}>
          {item.tier !== 0 ? item.tier : null}
        </div>
      )}
      {showArmory && linkToArmory && (
        <ArmorySheet onClose={() => setShowArmory(false)} item={item} />
      )}
    </button>
  );
}
