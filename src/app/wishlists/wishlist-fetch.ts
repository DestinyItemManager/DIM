import { toWishList } from './wishlist-file';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { showNotification } from 'app/notifications/notifications';
import { loadWishLists } from './actions';
import { ThunkResult } from 'app/store/reducers';
import { WishListAndInfo } from './types';
import { wishListsSelector } from './reducer';

export function fetchWishList(): ThunkResult<Promise<void>> {
  return async (dispatch, getState) => {
    const wishListSource = getState().settings.wishListSource;

    if (!wishListSource) {
      return;
    }

    const wishListResponse = await fetch(wishListSource);
    const wishListText = await wishListResponse.text();

    const wishListAndInfo = toWishList(wishListText);

    const existingWishLists = wishListsSelector(getState());

    // Only update if the length changed. The wish list may actually be different - we don't do a deep check -
    // but this is good enough to avoid re-doing the work over and over.
    if (
      existingWishLists?.wishListAndInfo?.wishListRolls?.length !==
      wishListAndInfo.wishListRolls.length
    ) {
      dispatch(transformAndStoreWishList(wishListAndInfo));
    } else {
      console.log('Refreshed wishlist, but it matched the one we already have');
    }
  };
}

export function transformAndStoreWishList(
  wishListAndInfo: WishListAndInfo
): ThunkResult<Promise<void>> {
  return async (dispatch) => {
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
