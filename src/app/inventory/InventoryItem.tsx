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

const superIcons = {
  arcStaff: '/common/destiny2_content/icons/8a0310f4fd1b1c3665eb8c7f455fb990.png',
  whirlwindGuard: '/common/destiny2_content/icons/80112a50fb48faaec3f45819d1f0e88e.png',
  goldenGun: '/common/destiny2_content/icons/a841279eee9770b4b97b1801038dfacd.png',
  bladeBarrage: '/common/destiny2_content/icons/0c6d627f649387897ef372ff454b7217.png',
  shadowshot: '/common/destiny2_content/icons/28f45711da09ad4b22c67be7bacf038a.png',
  spectralBlades: '/common/destiny2_content/icons/430d40b9ca7effcfea4d526d9b0b6cf9.png',

  stormtrance: '/common/destiny2_content/icons/3a744689afbe46d0e0485d241794ac53.png',
  chaosReach: '/common/destiny2_content/icons/a848cdbf5264279faa03bfc1dd795389.png',
  daybreak: '/common/destiny2_content/icons/62175315d4e6e6b39aa30614ce2a45fd.png',
  wellOfRadiance: '/common/destiny2_content/icons/b586c2a8c4b750f68bb19dbfefef08ee.png',
  novaBomb: '/common/destiny2_content/icons/6e3bb98ba7d9b3c4049af91b731fd52c.png',
  novaWarp: '/common/destiny2_content/icons/aba53c42fa2f81daa7b0b471a2da4067.png',

  fistOfHavoc: '/common/destiny2_content/icons/685c6dfff805f96371186527487e8440.png',
  thundercrash: '/common/destiny2_content/icons/e830b703ce61734c0c30d76d300feede.png',
  hammerOfSol: '/common/destiny2_content/icons/6204de291b057eccb6624673d60ba62f.png',
  burningMaul: '/common/destiny2_content/icons/ea984d037adc2c85124e05b175ec44a3.png',
  bannerShield: '/common/destiny2_content/icons/e6c301460732ad81e0a31cc8e31ee34c.png',
  sentinelShield: '/common/destiny2_content/icons/ea5fbc9946a6438fa92344e2fc642e1c.png'
};

const nodeHashToImage = {
  // Arcstrider
  1690891826: superIcons.arcStaff,
  3006627468: superIcons.whirlwindGuard,
  313617030: superIcons.arcStaff,
  // Gunslinger
  637433069: superIcons.goldenGun,
  1590824323: superIcons.bladeBarrage,
  2382523579: superIcons.goldenGun,
  // Nightstalker
  277476372: superIcons.shadowshot,
  499823166: superIcons.spectralBlades,
  4025960910: superIcons.shadowshot,
  // Dawnblade
  3352782816: superIcons.daybreak,
  935376049: superIcons.wellOfRadiance,
  966868917: superIcons.daybreak,
  // Stormcaller
  487158888: superIcons.stormtrance,
  3882393894: superIcons.chaosReach,
  3297679786: superIcons.stormtrance,
  // Voidwalker
  2718724912: superIcons.novaBomb,
  194702279: superIcons.novaWarp,
  1389184794: superIcons.novaBomb,
  // Striker
  4099943028: superIcons.fistOfHavoc,
  2795355746: superIcons.thundercrash,
  4293830764: superIcons.fistOfHavoc,
  // Sentinel
  3806272138: superIcons.sentinelShield,
  3504292102: superIcons.bannerShield,
  1347995538: superIcons.sentinelShield,
  // Sunbreaker
  3928207649: superIcons.hammerOfSol,
  1323416107: superIcons.burningMaul,
  1236431642: superIcons.hammerOfSol
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
