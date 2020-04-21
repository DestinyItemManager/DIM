import { toWishList } from './wishlist-file';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { showNotification } from 'app/notifications/notifications';
import { loadWishLists } from './actions';
import { ThunkResult } from 'app/store/reducers';
import { WishListAndInfo } from './types';
import { wishListsSelector, WishListsState } from './reducer';
import { settingsSelector } from 'app/settings/reducer';
import { setSetting } from 'app/settings/actions';
import { get } from 'idb-keyval';

function hoursAgo(dateToCheck?: Date): number {
  if (!dateToCheck) {
    return 99999;
  }

  return (Date.now() - dateToCheck.getTime()) / (1000 * 60 * 60);
}

export function fetchWishList(newWishlistSource?: string): ThunkResult {
  return async (dispatch, getState) => {
    await dispatch(loadWishListAndInfoFromIndexedDB());

    if (newWishlistSource) {
      dispatch(setSetting('wishListSource', newWishlistSource));
    }

    const wishListSource = settingsSelector(getState()).wishListSource;

    if (!wishListSource) {
      return;
    }

    const wishListLastUpdated = wishListsSelector(getState()).lastFetched;

    // Don't throttle updates if we're changing source
    if (!newWishlistSource && hoursAgo(wishListLastUpdated) < 24) {
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

export function transformAndStoreWishList(wishListAndInfo: WishListAndInfo): ThunkResult {
  return async (dispatch) => {
    if (wishListAndInfo.wishListRolls.length > 0) {
      dispatch(loadWishLists({ wishList: wishListAndInfo }));

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

function loadWishListAndInfoFromIndexedDB(): ThunkResult {
  return async (dispatch, getState) => {
    if (getState().wishLists.loaded) {
      return;
    }

    const wishListState = await get<WishListsState>('wishlist');

    if (getState().wishLists.loaded) {
      return;
    }

    // easing the transition from the old state (just an array) to the new state
    // (object containing an array)
    if (Array.isArray(wishListState?.wishListAndInfo?.wishListRolls)) {
      dispatch(
        loadWishLists({
          wishList: {
            title: undefined,
            description: undefined,
            wishListRolls: wishListState.wishListAndInfo.wishListRolls
          },
          lastFetched: wishListState.lastFetched
        })
      );
    }
  };
}
