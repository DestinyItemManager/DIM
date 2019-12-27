import { settings } from 'app/settings/settings';
import { setSetting } from 'app/settings/actions';
import { toWishList } from './wishlist-file';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { showNotification } from 'app/notifications/notifications';
import { loadWishLists } from './actions';

export class WishListMonitor {
  private wishListIntervalId?: number;

  start = () => {
    if (this.wishListIntervalId) {
      return;
    }

    fetchWishList();

    window.setInterval(fetchWishList, 1000 * 60 * 60);
  };

  stop = () => {
    if (!this.wishListIntervalId) {
      return;
    }
    window.clearInterval(this.wishListIntervalId);
  };
}

// https://stackoverflow.com/a/43735902/66109
function daysAgo(startDate?: Date): number {
  if (!startDate) {
    return 0;
  }

  const differenceInMilliseconds = Math.abs(new Date().getTime() - startDate.getTime());

  return Math.ceil(differenceInMilliseconds / (1000 * 3600 * 24));
}

export function fetchWishList(showAlert?: boolean) {
  if (!settings.wishListSource) {
    return;
  }

  if (settings.wishListLastChecked && daysAgo(settings.wishListLastChecked) < 0.5) {
    return;
  }

  fetch(settings.wishListSource)
    .then((result) => result.text())
    .then((resultText) => {
      transformAndStoreWishList(resultText, 'Fetch Wish List', showAlert);
      setSetting('wishListLastChecked', new Date());
    });
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
