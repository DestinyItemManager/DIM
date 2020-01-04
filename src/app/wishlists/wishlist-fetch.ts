import { toWishList } from './wishlist-file';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { showNotification } from 'app/notifications/notifications';
import { loadWishLists } from './actions';
import store from 'app/store/store';
import { ThunkResult } from 'app/store/reducers';

export function fetchWishList(): ThunkResult<Promise<void>> {
  return async (dispatch, getState) => {
    const wishListSource = getState().settings.wishListSource;

    if (!wishListSource) {
      return;
    }

    const wishListResponse = await fetch(wishListSource);
    const wishListText = await wishListResponse.text();

    dispatch(transformAndStoreWishList(wishListText, 'Fetch Wish List'));
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
      if (dispatch) {
        dispatch(loadWishLists(wishListAndInfo));
      } else {
        store.dispatch(loadWishLists(wishListAndInfo));
      }

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
