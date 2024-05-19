import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { setSettingAction } from 'app/settings/actions';
import { settingsReady } from 'app/settings/settings';
import { get } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { errorLog, infoLog } from 'app/utils/log';
import _ from 'lodash';
import { loadWishLists, touchWishLists } from './actions';
import type { WishListsState } from './reducer';
import { wishListsSelector } from './selectors';
import { WishListAndInfo } from './types';
import { validateWishListURLs } from './utils';
import { toWishList } from './wishlist-file';

const TAG = 'wishlist';

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
      dispatch(setSettingAction('wishListSource', newWishlistSource));
      return;
    }

    const wishlistToFetch = newWishlistSource ?? existingWishListSource;
    // done if there's neither an existing nor new URL
    if (!wishlistToFetch) {
      return;
    }

    // Pipe | seperated URLs
    const wishlistUrlsToFetch = validateWishListURLs(wishlistToFetch);

    const {
      lastFetched: wishListLastUpdated,
      wishListAndInfo: { source: loadedWishListSource, wishListRolls: loadedWishListRolls },
    } = wishListsSelector(getState());

    const wishListURLsChanged =
      loadedWishListSource !== undefined && loadedWishListSource !== wishlistToFetch;

    // Throttle updates if:
    if (
      // this isn't a settings update, and
      !newWishlistSource &&
      // if the intended fetch target is already the source of the loaded list
      !wishListURLsChanged &&
      // we already checked the wishlist today
      hoursAgo(wishListLastUpdated) < 24
    ) {
      return;
    }

    let wishListTexts: string[];
    try {
      wishListTexts = await Promise.all(
        wishlistUrlsToFetch.map((url) =>
          fetch(url).then((res) => {
            if (res.status < 200 || res.status >= 300) {
              throw new Error(`failed fetch -- ${res.status} ${res.statusText}`);
            }

            return res.text();
          }),
        ),
      );

      // if this is a new wishlist, set the setting now that we know it's fetchable
      if (newWishlistSource) {
        dispatch(setSettingAction('wishListSource', newWishlistSource));
      }
    } catch (e) {
      showNotification({
        type: 'warning',
        title: t('WishListRoll.Header'),
        body: t('WishListRoll.ImportFailed'),
      });
      errorLog(TAG, 'Unable to load wish list', e);
      return;
    }

    const wishLists: [string, string][] = wishlistUrlsToFetch.map((url, idx) => [
      url,
      wishListTexts[idx],
    ]);

    const wishListAndInfo = toWishList(...wishLists);
    wishListAndInfo.source = wishlistToFetch;

    // Only update if the length changed. The wish list may actually be different - we don't do a deep check -
    // but this is good enough to avoid re-doing the work over and over.
    if (
      loadedWishListRolls?.length !== wishListAndInfo.wishListRolls.length ||
      wishListURLsChanged
    ) {
      await dispatch(transformAndStoreWishList(wishListAndInfo));
    } else {
      infoLog(TAG, 'Refreshed wishlist, but it matched the one we already have');
      dispatch(touchWishLists());
    }
    await dispatch(transformAndStoreWishList(wishListAndInfo));
  };
}

export function transformAndStoreWishList(wishListAndInfo: WishListAndInfo): ThunkResult {
  return async (dispatch) => {
    if (wishListAndInfo.wishListRolls.length > 0) {
      dispatch(loadWishLists({ wishListAndInfo }));
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

    try {
      const wishListState = await get<WishListsState>('wishlist');

      if (getState().wishLists.loaded) {
        return;
      }

      // Previously we didn't save the URLs together with the source info,
      // but we want this now.
      if (wishListState?.wishListAndInfo.source) {
        const urls = _.once(() => validateWishListURLs(wishListState.wishListAndInfo.source!));
        for (const [idx, entry] of wishListState.wishListAndInfo.infos.entries()) {
          if (entry.url === undefined) {
            entry.url = urls()[idx];
          }
        }
      }

      if (wishListState?.wishListAndInfo?.wishListRolls?.length) {
        dispatch(loadWishLists(wishListState));
      }
    } catch (e) {
      errorLog(TAG, 'unable to load wishlists from IDB', e);
    }
  };
}
