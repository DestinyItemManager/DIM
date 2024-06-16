import { t } from 'app/i18next-t';
import { UiWishListRoll } from 'app/wishlists/wishlists';
import { AppIcon, thumbsDownIcon, thumbsUpIcon } from '../shell/icons';
import styles from './RatingIcon.m.scss';

export default function RatingIcon({ uiWishListRoll }: { uiWishListRoll: UiWishListRoll }) {
  if (uiWishListRoll === UiWishListRoll.Bad) {
    return (
      <AppIcon className={styles.trashlist} icon={thumbsDownIcon} title={t('Item.ThumbsDown')} />
    );
  }

  return <AppIcon className={styles.godroll} icon={thumbsUpIcon} title={t('Item.ThumbsUp')} />;
}
