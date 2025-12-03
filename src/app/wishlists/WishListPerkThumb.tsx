import { t } from 'app/i18next-t';
import { AppIcon, thumbsDownIcon, thumbsUpIcon } from 'app/shell/icons';
import clsx from 'clsx';
import * as styles from './WishListPerkThumb.m.scss';
import { WishListRoll } from './types';
import { InventoryWishListRoll } from './wishlists';

/**
 * The little thumbs-up (or down) shown on wishlisted perks.
 */
export default function WishListPerkThumb({
  wishListRoll,
  className,
  floated,
  legend,
}: {
  wishListRoll: WishListRoll | InventoryWishListRoll;
  className?: string;
  floated?: boolean;
  legend?: boolean;
}) {
  const perks =
    wishListRoll &&
    ('recommendedPerks' in wishListRoll
      ? wishListRoll.recommendedPerks
      : wishListRoll.wishListPerks);

  const title = wishListRoll.isUndesirable
    ? t('WishListRoll.WorstRatedTip', { count: perks.size })
    : t('WishListRoll.BestRatedTip', { count: perks.size });

  return (
    <>
      <AppIcon
        className={clsx(styles.thumb, className, {
          [styles.floated]: floated,
          [styles.trashlist]: wishListRoll.isUndesirable,
        })}
        icon={wishListRoll.isUndesirable ? thumbsDownIcon : thumbsUpIcon}
        title={title}
      />
      {legend && <> = {title}</>}
    </>
  );
}
