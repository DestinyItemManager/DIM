import { TOTAL_STAT_HASH } from 'app/search/d2-known-values';
import { getColor } from 'app/shell/formatters';
import { shapedIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { isD1Item } from 'app/utils/item-utils';
import { InventoryWishListRoll, toUiWishListRoll } from 'app/wishlists/wishlists';
import { DamageType } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import { useSelector } from 'react-redux';
import ElementIcon from '../dim-ui/ElementIcon';
import styles from './BadgeInfo.m.scss';
import RatingIcon from './RatingIcon';
import { DimItem } from './item-types';
import { notesSelector } from './selectors';

interface Props {
  item: DimItem;
  isCapped: boolean;
  wishlistRoll?: InventoryWishListRoll;
}

export function shouldShowBadge(item: DimItem) {
  const isBounty = Boolean(!item.primaryStat && item.objectives);
  const isStackable = Boolean(item.maxStackSize > 1);
  const isGeneric = !isBounty && !isStackable;

  const hideBadge = Boolean(
    item.location.hash === BucketHashes.Subclass ||
      (item.isEngram && item.location.hash === BucketHashes.Engrams) ||
      (isBounty && (item.complete || item.hidePercentage)) ||
      (isStackable && item.amount === 1) ||
      (isGeneric && !item.primaryStat?.value && !item.classified),
  );

  return !hideBadge;
}

export default function BadgeInfo({ item, isCapped, wishlistRoll }: Props) {
  const isBounty = Boolean(!item.primaryStat && item.objectives);
  const isStackable = Boolean(item.maxStackSize > 1);
  const isGeneric = !isBounty && !isStackable;
  // For vendor armor that reports stats (thus often randomized),
  // show the total points as a means to indicate whether it's worth picking up
  const totalArmorStat =
    item.bucket?.inArmor &&
    item.vendor &&
    item.stats?.find((stat) => stat.statHash === TOTAL_STAT_HASH);

  const hideBadge = Boolean(
    item.location.hash === BucketHashes.Subclass ||
      (item.isEngram && item.location.hash === BucketHashes.Engrams) ||
      (isBounty && (item.complete || item.hidePercentage)) ||
      (isStackable && item.amount === 1) ||
      (isGeneric && !item.primaryStat?.value && !item.classified),
  );

  if (hideBadge) {
    return null;
  }

  const badgeContent =
    (isBounty && `${Math.floor(100 * item.percentComplete)}%`) ||
    (isStackable && item.amount.toString()) ||
    (totalArmorStat && totalArmorStat.value.toString()) ||
    (isGeneric && item.primaryStat?.value.toString()) ||
    (item.classified && <ClassifiedNotes item={item} />);

  const fixContrast =
    item.element &&
    (item.element.enumValue === DamageType.Arc ||
      item.element.enumValue === DamageType.Void ||
      item.element.enumValue === DamageType.Strand);

  const wishlistRollIcon = toUiWishListRoll(wishlistRoll);
  const summaryIcon = item.crafted ? (
    <AppIcon className={styles.shapedIcon} icon={shapedIcon} />
  ) : (
    wishlistRollIcon && <RatingIcon uiWishListRoll={wishlistRollIcon} />
  );

  return (
    <div
      className={clsx(styles.badge, {
        [styles.fullstack]: isStackable && item.amount === item.maxStackSize,
        [styles.capped]: isCapped,
        [styles.masterwork]: item.masterwork,
        [styles.deepsight]: item.deepsightInfo,
        [styles.engram]: item.isEngram,
      })}
    >
      {isD1Item(item) && item.quality && (
        <div className={styles.quality} style={getColor(item.quality.min, 'backgroundColor')}>
          {item.quality.min}%
        </div>
      )}
      {summaryIcon}
      {item.energy ? (
        <span className={styles.energyCapacity}>{item.energy.energyCapacity}</span>
      ) : (
        item.element &&
        !(item.bucket.inWeapons && item.element.enumValue === DamageType.Kinetic) && (
          <ElementIcon
            element={item.element}
            className={clsx({ [styles.fixContrast]: fixContrast })}
          />
        )
      )}
      <span className={styles.badgeContent}>{badgeContent}</span>
    </div>
  );
}

/**
 * ClassifiedNotes shows the notes field for classified items as a way to make
 * them easier to ID. It's broken out into its own component so that the store
 * subscription for notes only happens for classified items.
 */
function ClassifiedNotes({ item }: { item: DimItem }) {
  const savedNotes = useSelector(notesSelector(item));
  return <>{savedNotes ?? '???'}</>;
}
