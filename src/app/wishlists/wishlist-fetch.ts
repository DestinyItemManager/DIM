import { toWishList } from './wishlist-file';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { showNotification } from 'app/notifications/notifications';
import { loadWishLists } from './actions';
import { ThunkResult } from 'app/store/reducers';
import { setSetting } from 'app/settings/actions';

function hoursAgo(dateToCheck?: Date): number {
  if (!dateToCheck) {
    return 99999;
  }

  return Math.abs(new Date().getTime() - dateToCheck.getTime()) / (1000 * 60 * 60);
}

export function fetchWishList(ignoreThrottle: boolean): ThunkResult<Promise<void>> {
  return async (dispatch, getState) => {
    const wishListSource = getState().settings.wishListSource;

    if (!wishListSource) {
      return;
    }

    const wishListLastUpdated = getState().settings.wishListLastUpdated;

    if (!ignoreThrottle && hoursAgo(wishListLastUpdated) < 24) {
      return;
    }

    const wishListResponse = await fetch(wishListSource);
    const wishListText = await wishListResponse.text();

    dispatch(transformAndStoreWishList(wishListText, 'Fetch Wish List'));

    const currentDate = new Date();
    dispatch(setSetting('wishListLastUpdated', currentDate));
  };
}

export function transformAndStoreWishList(
  wishListResult: string,
  eventName: string
): ThunkResult<Promise<void>> {
  return async (dispatch) => {
    const wishListAndInfo = toWishList(wishListResult);
    ga('send', 'event', 'Rating Options', eventName);

    if (wishListAndInfo.wishListRolls.length > 0) {
      dispatch(loadWishLists(wishListAndInfo));

      const titleAndDescription = _.compact([
        wishListAndInfo.title,
        wishListAndInfo.description
      ]).join('\n');

      showNotification({
        type: 'success',
        title: t('WishListRoll.Header'),
        body: t('WishListRoll.ImportSuccess', {
          count: wishListAndInfo.wishListRolls.length,
          titleAndDescription
        })
      });
    } else {
      showNotification({
        type: 'warning',
        title: t('WishListRoll.Header'),
        body: t('WishListRoll.ImportFailed')
      });
    }
  };
}
