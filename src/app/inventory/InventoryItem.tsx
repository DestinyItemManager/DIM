import React from 'react';
import clsx from 'clsx';
import { DimItem, DimTalentGrid } from './item-types';
import { TagValue, itemTags } from './dim-item-info';
import BadgeInfo from './BadgeInfo';
import BungieImage from '../dim-ui/BungieImage';
import { percent } from '../shell/filters';
import { AppIcon, lockIcon, stickyNoteIcon } from '../shell/icons';
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
  /** Don't show information that relates to currently selected perks (only used for subclasses currently) */
  ignoreSelectedPerks?: boolean;
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
  ignoreSelectedPerks,
  onClick,
  onShiftClick,
  onDoubleClick,
  innerRef
}: Props) {
  const isCapped = item.maxStackSize > 1 && item.amount === item.maxStackSize && item.uniqueStack;
  const isWishListRoll = Boolean(curationEnabled && inventoryCuratedRoll);

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

  const subclassPath =
    (!ignoreSelectedPerks &&
      item.isDestiny2 &&
      item.isDestiny2() &&
      item.talentGrid &&
      selectedSubclassPath(item.talentGrid)) ||
    null;
  const itemStyles = {
    [styles.searchHidden]: searchHidden,
    [styles.subclassPathTop]: subclassPath && subclassPath.position === 'top',
    [styles.subclassPathMiddle]: subclassPath && subclassPath.position === 'middle',
    [styles.subclassPathBottom]: subclassPath && subclassPath.position === 'bottom'
  };
  const itemImageStyles = clsx('item-img', {
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
      className={clsx('item', itemStyles)}
      ref={innerRef}
    >
      {item.percentComplete > 0 && !item.complete && (
        <div className={styles.xpBar}>
          <div className={styles.xpBarAmount} style={{ width: percent(item.percentComplete) }} />
        </div>
      )}
      {(subclassPath && subclassPath.base && (
        <img src={subclassPath.base} className={itemImageStyles} />
      )) || <BungieImage src={item.icon} className={itemImageStyles} />}
      <BadgeInfo item={item} rating={rating} isCapped={isCapped} isWishListRoll={isWishListRoll} />
      {item.masterwork && (
        <div className={clsx(styles.masterworkOverlay, { [styles.exotic]: item.isExotic })} />
      )}
      {(tag || item.locked || notes) && (
        <div className={styles.icons}>
          {item.locked && <AppIcon className={styles.icon} icon={lockIcon} />}
          {tag && tagIcons[tag] && <AppIcon className={styles.icon} icon={tagIcons[tag]!} />}
          {notes && <AppIcon className={styles.icon} icon={stickyNoteIcon} />}
        </div>
      )}
      {isNew && <NewItemIndicator />}
      {subclassPath && subclassPath.super && (
        <BungieImage src={subclassPath.super} className={styles.subclass} />
      )}
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

const superIconNodeHashes = {
  arcStaff: 2936898795,
  whirlwindGuard: 3006627468,
  goldenGun: 675014898,
  bladeBarrage: 1590824323,
  shadowshot: 3931765019,
  spectralBlades: 499823166,

  stormtrance: 178252917,
  chaosReach: 3882393894,
  daybreak: 4102085486,
  wellOfRadiance: 935376049,
  novaBomb: 3082407249,
  novaWarp: 194702279,

  fistsofHavoc: 1757742244,
  thundercrash: 2795355746,
  sentinelShield: 368405360,
  bannerShield: 3504292102,
  hammerOfSol: 1722642322,
  burningMaul: 1323416107
};

const nodeHashToSubclassPath: {
  [hash: number]: {
    base: string;
    position: 'top' | 'middle' | 'bottom';
    superHash: number;
  };
} = {
  // Arcstrider
  1690891826: { base: subclassArc, position: 'top', superHash: superIconNodeHashes.arcStaff },
  3006627468: {
    base: subclassArc,
    position: 'middle',
    superHash: superIconNodeHashes.whirlwindGuard
  },
  313617030: { base: subclassArc, position: 'bottom', superHash: superIconNodeHashes.arcStaff },
  // Gunslinger
  637433069: { base: subclassSolar, position: 'top', superHash: superIconNodeHashes.goldenGun },
  1590824323: {
    base: subclassSolar,
    position: 'middle',
    superHash: superIconNodeHashes.bladeBarrage
  },
  2382523579: { base: subclassSolar, position: 'bottom', superHash: superIconNodeHashes.goldenGun },
  // Nightstalker
  277476372: { base: subclassVoid, position: 'top', superHash: superIconNodeHashes.shadowshot },
  499823166: {
    base: subclassVoid,
    position: 'middle',
    superHash: superIconNodeHashes.spectralBlades
  },
  4025960910: { base: subclassVoid, position: 'bottom', superHash: superIconNodeHashes.shadowshot },
  // Dawnblade
  3352782816: { base: subclassSolar, position: 'top', superHash: superIconNodeHashes.daybreak },
  935376049: {
    base: subclassSolar,
    position: 'middle',
    superHash: superIconNodeHashes.wellOfRadiance
  },
  966868917: { base: subclassSolar, position: 'bottom', superHash: superIconNodeHashes.daybreak },
  // Stormcaller
  487158888: { base: subclassArc, position: 'top', superHash: superIconNodeHashes.stormtrance },
  3882393894: { base: subclassArc, position: 'middle', superHash: superIconNodeHashes.chaosReach },
  3297679786: { base: subclassArc, position: 'bottom', superHash: superIconNodeHashes.stormtrance },
  // Voidwalker
  2718724912: { base: subclassVoid, position: 'top', superHash: superIconNodeHashes.novaBomb },
  194702279: { base: subclassVoid, position: 'middle', superHash: superIconNodeHashes.novaWarp },
  1389184794: { base: subclassVoid, position: 'bottom', superHash: superIconNodeHashes.novaBomb },
  // Striker
  4099943028: { base: subclassArc, position: 'top', superHash: superIconNodeHashes.fistsofHavoc },
  2795355746: {
    base: subclassArc,
    position: 'middle',
    superHash: superIconNodeHashes.thundercrash
  },
  4293830764: {
    base: subclassArc,
    position: 'bottom',
    superHash: superIconNodeHashes.fistsofHavoc
  },
  // Sentinel
  3806272138: {
    base: subclassVoid,
    position: 'top',
    superHash: superIconNodeHashes.sentinelShield
  },
  3504292102: {
    base: subclassVoid,
    position: 'middle',
    superHash: superIconNodeHashes.bannerShield
  },
  1347995538: {
    base: subclassVoid,
    position: 'bottom',
    superHash: superIconNodeHashes.sentinelShield
  },
  // Sunbreaker
  3928207649: { base: subclassSolar, position: 'top', superHash: superIconNodeHashes.hammerOfSol },
  1323416107: {
    base: subclassSolar,
    position: 'middle',
    superHash: superIconNodeHashes.burningMaul
  },
  1236431642: {
    base: subclassSolar,
    position: 'bottom',
    superHash: superIconNodeHashes.hammerOfSol
  }
};

function selectedSubclassPath(talentGrid: DimTalentGrid) {
  for (const node of talentGrid.nodes) {
    if (node.activated && nodeHashToSubclassPath[node.hash]) {
      const def = nodeHashToSubclassPath[node.hash];
      const superNode = def.superHash && talentGrid.nodes.find((n) => n.hash === def.superHash);
      return {
        base: def.base,
        position: def.position,
        super: superNode && superNode.icon
      };
    }
  }

  return null;
}
