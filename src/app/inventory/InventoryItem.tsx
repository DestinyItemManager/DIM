import React from 'react';
import classNames from 'classnames';
import { DimItem, DimTalentGrid } from './item-types';
import { TagValue, itemTags } from './dim-item-info';
import BadgeInfo from './BadgeInfo';
import BungieImage from '../dim-ui/BungieImage';
import { percent } from '../shell/filters';
import { AppIcon, lockIcon, thumbsUpIcon, stickyNoteIcon } from '../shell/icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { InventoryCuratedRoll } from '../wishlists/wishlists';
import styles from './InventoryItem.m.scss';
import NewItemIndicator from './NewItemIndicator';

const tagIcons: { [tag: string]: IconDefinition | undefined } = {};
itemTags.forEach((tag) => {
  if (tag.type) {
    tagIcons[tag.type] = tag.icon;
  }
});

interface Props {
  item: DimItem;
  /** Show this item as new? */
  isNew?: boolean;
  /** User defined tag */
  tag?: TagValue;
  /**  */
  notes?: boolean;
  /** Rating value */
  rating?: number;
  /** Has this been hidden by a search? */
  searchHidden?: boolean;
  curationEnabled?: boolean;
  inventoryCuratedRoll?: InventoryCuratedRoll;
  innerRef?: React.Ref<HTMLDivElement>;
  /** TODO: item locked needs to be passed in */
  onClick?(e);
  onShiftClick?(e): void;
  onDoubleClick?(e);
}

export default function InventoryItem({
  item,
  isNew,
  tag,
  notes,
  rating,
  searchHidden,
  curationEnabled,
  inventoryCuratedRoll,
  onClick,
  onShiftClick,
  onDoubleClick,
  innerRef
}: Props) {
  const isCapped = item.maxStackSize > 1 && item.amount === item.maxStackSize && item.uniqueStack;

  const itemImageStyles = {
    [styles.searchHidden]: searchHidden
  };

  const treatAsCurated = Boolean(curationEnabled && inventoryCuratedRoll);

  let enhancedOnClick = onClick;
  if (onShiftClick) {
    enhancedOnClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.shiftKey) {
        onShiftClick(e);
      } else if (onClick) {
        onClick(e);
      }
    };
  }

  const subclassIconImage = item.isDestiny2() && item.talentGrid && subclassIcon(item.talentGrid);

  return (
    <div
      id={item.index}
      onClick={enhancedOnClick}
      onDoubleClick={onDoubleClick}
      title={`${item.name}\n${item.typeName}`}
      className={classNames('item', itemImageStyles)}
      ref={innerRef}
    >
      {item.percentComplete > 0 && !item.complete && (
        <div className={styles.xpBar}>
          <div className={styles.xpBarAmount} style={{ width: percent(item.percentComplete) }} />
        </div>
      )}
      <BungieImage
        src={item.icon}
        className={classNames('item-img', {
          [styles.complete]: item.complete || isCapped,
          [styles.borderless]: borderless(item),
          [styles.masterwork]: item.masterwork
        })}
      />
      <BadgeInfo item={item} rating={rating} isCapped={isCapped} />
      {item.masterwork && (
        <div className={classNames(styles.masterworkOverlay, { [styles.exotic]: item.isExotic })} />
      )}
      {(tag || item.locked || treatAsCurated || notes) && (
        <div className={styles.icons}>
          {item.locked && <AppIcon className={styles.icon} icon={lockIcon} />}
          {tag && tagIcons[tag] && <AppIcon className={styles.icon} icon={tagIcons[tag]!} />}
          {treatAsCurated && <AppIcon className={styles.icon} icon={thumbsUpIcon} />}
          {notes && <AppIcon className={styles.icon} icon={stickyNoteIcon} />}
        </div>
      )}
      {isNew && <NewItemIndicator />}
      {subclassIconImage && <BungieImage className={styles.subclass} src={subclassIconImage} />}
    </div>
  );
}

export function borderless(item: DimItem) {
  return (
    (item.isDestiny2 &&
      item.isDestiny2() &&
      (item.bucket.hash === 3284755031 ||
        (item.itemCategoryHashes && item.itemCategoryHashes.includes(268598612)))) ||
    item.isEngram
  );
}

const hunterTop = '/common/destiny2_content/icons/7df81508fc637789baf1ef30f20e99e9.png';
const hunterBottom = '/common/destiny2_content/icons/473693b8031f6fcc467d26e75dc9a2f4.png';
const hunterMid = '/common/destiny2_content/icons/d290f8ed26ef2d7c0f7c25379900fb0c.png';
const warlockTop = '/common/destiny2_content/icons/fc7b144288afef1e121f41c7b7f01761.png';
const warlockMid = '/common/destiny2_content/icons/aae8f402db148a92d1404e29610e038b.png';
const warlockBottom = '/common/destiny2_content/icons/ef55b744a0fcc02dee7a7b97edab24f3.png';
const titanTop = '/common/destiny2_content/icons/53b46914177002c901af24230fb23ab2.png';
const titanMid = '/common/destiny2_content/icons/1c168489dacb81871a93b784c7ebec2f.png';
const titanBottom = '/common/destiny2_content/icons/2d4c50d2485012564e8e271a2aece1fb.png';

const nodeHashToImage = {
  // Arcstrider
  1690891826: hunterTop,
  3006627468: hunterMid,
  313617030: hunterBottom,
  // Gunslinger
  637433069: hunterTop,
  1590824323: hunterMid,
  2382523579: hunterBottom,
  // Nightstalker
  277476372: hunterTop,
  499823166: hunterMid,
  4025960910: hunterBottom,
  // Dawnblade
  3352782816: warlockTop,
  935376049: warlockMid,
  966868917: warlockBottom,
  // Stormcaller
  487158888: warlockTop,
  3882393894: warlockMid,
  3297679786: warlockBottom,
  // Voidwalker
  2718724912: warlockTop,
  194702279: warlockMid,
  1389184794: warlockBottom,
  // Striker
  4099943028: titanTop,
  2795355746: titanMid,
  4293830764: titanBottom,
  // Sentinel
  3806272138: titanTop,
  3504292102: titanMid,
  1347995538: titanBottom,
  // Sunbreaker
  3928207649: titanTop,
  1323416107: titanMid,
  1236431642: titanBottom
};

function subclassIcon(talentGrid: DimTalentGrid) {
  console.log(talentGrid);
  for (const node of talentGrid.nodes) {
    if (node.activated && nodeHashToImage[node.hash]) {
      return nodeHashToImage[node.hash];
    }
  }

  return null;
}
