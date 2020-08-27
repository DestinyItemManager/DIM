import { toWishList } from './wishlist-file';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { showNotification } from 'app/notifications/notifications';
import { loadWishLists, touchWishLists } from './actions';
import { ThunkResult } from 'app/store/types';
import { WishListAndInfo } from './types';
import { wishListsSelector, WishListsState } from './reducer';
import { settingsSelector } from 'app/settings/reducer';
import { setSetting } from 'app/settings/actions';
import { get } from 'idb-keyval';
import { settingsReady } from 'app/settings/settings';
import { isValidWishListUrlDomain, wishListAllowedPrefixes } from 'app/settings/WishListSettings';

function hoursAgo(dateToCheck?: Date): number {
  if (!dateToCheck) {
    return 99999;
  }

  return (Date.now() - dateToCheck.getTime()) / (1000 * 60 * 60);
}

/**
 * this performs both the initial fetch (after setting a new wishlist) (when arg0 exists)
 * and subsequent fetches (checking for updates) (arg-less)
 */
export function fetchWishList(newWishlistSource?: string): ThunkResult {
  return async (dispatch, getState) => {
    await dispatch(loadWishListAndInfoFromIndexedDB());
    await settingsReady;

    const existingWishListSource = settingsSelector(getState()).wishListSource;

    // a blank source was submitted, indicating an intention to clear the wishlist
    if (newWishlistSource === '' && newWishlistSource !== existingWishListSource) {
      dispatch(setSetting('wishListSource', newWishlistSource));
      return;
    }

    const wishlistToFetch = newWishlistSource ?? existingWishListSource;
    // done if there's neither an existing nor new URL
    if (!wishlistToFetch) {
      return;
    }

    // there's a source if we reached this far, but check if it's invalid
    if (!isValidWishListUrlDomain(wishlistToFetch)) {
      showNotification({
        type: 'warning',
        title: t('WishListRoll.Header'),
        body: `${t('WishListRoll.InvalidExternalSource')}\n${wishListAllowedPrefixes.join('\n')}`,
        duration: 10000,
      });
      return;
    }

    const {
      lastFetched: wishListLastUpdated,
      wishListAndInfo: { source: loadedWishListSource },
    } = wishListsSelector(getState());

    // Throttle updates if:
    if (
      // this isn't a settings update, and
      !newWishlistSource &&
      // if the intended fetch target is already the source of the loaded list
      (loadedWishListSource === undefined || loadedWishListSource === wishlistToFetch) &&
      // we already checked the wishlist today
      hoursAgo(wishListLastUpdated) < 24
    ) {
      return;
    }

    let wishListText: string;
    try {
      const wishListResponse = await fetch(wishlistToFetch);
      if (wishListResponse.status < 200 || wishListResponse.status >= 300) {
        throw new Error(
          `failed fetch -- ${wishListResponse.status} ${wishListResponse.statusText}`
        );
      }
      wishListText = await wishListResponse.text();
      // if this is a new wishlist, set the setting now that we know it's fetchable
      if (newWishlistSource) {
        dispatch(setSetting('wishListSource', newWishlistSource));
      }
    } catch (e) {
      showNotification({
        type: 'warning',
        title: t('WishListRoll.Header'),
        body: t('WishListRoll.ImportFailed'),
      });
      console.error('Unable to load wish list', e);
      return;
    }

    const wishListAndInfo = toWishList(wishListText);
    wishListAndInfo.source = wishlistToFetch;

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
      dispatch(touchWishLists());
    }
  };
}

export function transformAndStoreWishList(wishListAndInfo: WishListAndInfo): ThunkResult {
  return async (dispatch) => {
    if (wishListAndInfo.wishListRolls.length > 0) {
      dispatch(loadWishLists({ wishListAndInfo }));

      const titleAndDescription = _.compact([
        wishListAndInfo.title,
        wishListAndInfo.description,
      ]).join('\n');

      showNotification({
        type: 'success',
        title: t('WishListRoll.Header'),
        body: t('WishListRoll.ImportSuccess', {
          count: wishListAndInfo.wishListRolls.length,
          titleAndDescription,
        }),
      });
    } else {
      showNotification({
        type: 'warning',
        title: t('WishListRoll.Header'),
        body: t('WishListRoll.ImportFailed'),
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

    if (wishListState?.wishListAndInfo?.wishListRolls?.length) {
      dispatch(loadWishLists(wishListState));
    }
  };
}
