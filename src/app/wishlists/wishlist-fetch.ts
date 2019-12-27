import { settings } from 'app/settings/settings';
import { setSetting } from 'app/settings/actions';
import { toWishList } from './wishlist-file';
import { t } from 'app/i18next-t';
import _ from 'lodash';

// https://stackoverflow.com/a/43735902/66109
function daysAgo(startDate?: Date): number {
  if (!startDate) {
    return 0;
  }

  const differenceInMilliseconds = Math.abs(new Date().getTime() - startDate.getTime());

  return Math.ceil(differenceInMilliseconds / (1000 * 3600 * 24));
}

export function fetchWishlist(showAlert?: boolean) {
  if (!settings.wishListSource) {
    return;
  }

  if (settings.wishListLastChecked && daysAgo(settings.wishListLastChecked) < 0.5) {
    return;
  }

  fetch(settings.wishListSource)
    .then((result) => result.text())
    .then((resultText) => transformAndStoreWishList(resultText, 'Fetch Wish List', showAlert))
    .then(() => setSetting('wishListLastChecked', new Date()));
}

export function transformAndStoreWishList(
  wishListResult: string,
  eventName: string,
  showAlert?: boolean
) {
  const wishListAndInfo = toWishList(wishListResult);
  ga('send', 'event', 'Rating Options', eventName);

  if (wishListAndInfo.wishListRolls.length > 0) {
    this.props.loadWishListAndInfo(wishListAndInfo);

    if (showAlert) {
      const titleAndDescription = _.compact([
        wishListAndInfo.title,
        wishListAndInfo.description
      ]).join('\n');

      alert(
        t('WishListRoll.ImportSuccess', {
          count: wishListAndInfo.wishListRolls.length,
          titleAndDescription
        })
      );
    }
  } else if (!showAlert) {
    alert(t('WishListRoll.ImportFailed'));
  }
}
