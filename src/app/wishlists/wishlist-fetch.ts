import { settings } from 'app/settings/settings';
import { toWishList } from './wishlist-file';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { showNotification } from 'app/notifications/notifications';
import { loadWishLists } from './actions';

export function fetchWishList(showAlert?: boolean) {
  if (!settings.wishListSource) {
    return;
  }

  fetch(settings.wishListSource)
    .then((result) => result.text())
    .then((resultText) => transformAndStoreWishList(resultText, 'Fetch Wish List', showAlert));
}

export function transformAndStoreWishList(
  wishListResult: string,
  eventName: string,
  showAlert?: boolean
) {
  const wishListAndInfo = toWishList(wishListResult);
  ga('send', 'event', 'Rating Options', eventName);

  if (wishListAndInfo.wishListRolls.length > 0) {
    loadWishLists(wishListAndInfo);

    const titleAndDescription = _.compact([
      wishListAndInfo.title,
      wishListAndInfo.description
    ]).join('\n');

    if (showAlert) {
      alert(
        t('WishListRoll.ImportSuccess', {
          count: wishListAndInfo.wishListRolls.length,
          titleAndDescription
        })
      );
    } else {
      showNotification({
        type: 'success',
        title: t('WishListRoll.Header'),
        body: t('WishListRoll.ImportSuccess', {
          count: wishListAndInfo.wishListRolls.length,
          titleAndDescription
        })
      });
    }
  } else {
    if (showAlert) {
      alert(t('WishListRoll.ImportFailed'));
    } else {
      showNotification({
        type: 'warning',
        title: t('WishListRoll.Header'),
        body: t('WishListRoll.ImportFailed')
      });
    }
  }
}
