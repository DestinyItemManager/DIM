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
import subclassArc from 'images/subclass-arc.png';
import subclassSolar from 'images/subclass-solar.png';
import subclassVoid from 'images/subclass-void.png';

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

  const subclass = item.isDestiny2() && item.talentGrid && subclassDef(item.talentGrid);
  const imageClassName = classNames('item-img', {
    [styles.complete]: item.complete || isCapped,
    [styles.borderless]: borderless(item),
    [styles.masterwork]: item.masterwork
  });

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
      {(subclass && subclass.base && <img src={subclass.base} className={imageClassName} />) || (
        <BungieImage src={item.icon} className={imageClassName} />
      )}
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
      {subclass && subclass.icon && <BungieImage className={styles.subclass} src={subclass.icon} />}
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

const nodeHashToSubclassDef = {
  // Arcstrider
  1690891826: { icon: superIcons.arcStaff, base: subclassArc },
  3006627468: { icon: superIcons.whirlwindGuard, base: subclassArc },
  313617030: { icon: superIcons.arcStaff, base: subclassArc },
  // Gunslinger
  637433069: { icon: superIcons.goldenGun, base: subclassSolar },
  1590824323: { icon: superIcons.bladeBarrage, base: subclassSolar },
  2382523579: { icon: superIcons.goldenGun, base: subclassSolar },
  // Nightstalker
  277476372: { icon: superIcons.shadowshot, base: subclassVoid },
  499823166: { icon: superIcons.spectralBlades, base: subclassVoid },
  4025960910: { icon: superIcons.shadowshot, base: subclassVoid },
  // Dawnblade
  3352782816: { icon: superIcons.daybreak, base: subclassSolar },
  935376049: { icon: superIcons.wellOfRadiance, base: subclassSolar },
  966868917: { icon: superIcons.daybreak, base: subclassSolar },
  // Stormcaller
  487158888: { icon: superIcons.stormtrance, base: subclassArc },
  3882393894: { icon: superIcons.chaosReach, base: subclassArc },
  3297679786: { icon: superIcons.stormtrance, base: subclassArc },
  // Voidwalker
  2718724912: { icon: superIcons.novaBomb, base: subclassVoid },
  194702279: { icon: superIcons.novaWarp, base: subclassVoid },
  1389184794: { icon: superIcons.novaBomb, base: subclassVoid },
  // Striker
  4099943028: { icon: superIcons.fistOfHavoc, base: subclassArc },
  2795355746: { icon: superIcons.thundercrash, base: subclassArc },
  4293830764: { icon: superIcons.fistOfHavoc, base: subclassArc },
  // Sentinel
  3806272138: { icon: superIcons.sentinelShield, base: subclassVoid },
  3504292102: { icon: superIcons.bannerShield, base: subclassVoid },
  1347995538: { icon: superIcons.sentinelShield, base: subclassVoid },
  // Sunbreaker
  3928207649: { icon: superIcons.hammerOfSol, base: subclassSolar },
  1323416107: { icon: superIcons.burningMaul, base: subclassSolar },
  1236431642: { icon: superIcons.hammerOfSol, base: subclassSolar }
};

function subclassDef(talentGrid: DimTalentGrid) {
  for (const node of talentGrid.nodes) {
    if (node.activated && nodeHashToSubclassDef[node.hash]) {
      return nodeHashToSubclassDef[node.hash];
    }
  }

  return null;
}
