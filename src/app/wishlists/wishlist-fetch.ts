import { toHttpStatusError } from 'app/bungie-api/http-client';
import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { setSettingAction } from 'app/settings/actions';
import { settingsReady } from 'app/settings/settings';
import { get } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { errorMessage } from 'app/utils/errors';
import { errorLog, infoLog } from 'app/utils/log';
import { once } from 'es-toolkit';
import { clearWishLists, loadWishLists, touchWishLists } from './actions';
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
 * this performs both the initial fetch (after setting a new wishlist) (when newWishlistSource exists)
 * and subsequent fetches (checking for updates) (arg-less)
 */
export function fetchWishList(newWishlistSource?: string, manualRefresh?: boolean): ThunkResult {
  return async (dispatch, getState) => {
    await dispatch(loadWishListAndInfoFromIndexedDB());
    await settingsReady;

    const existingWishListSource = settingsSelector(getState()).wishListSource;

    // a blank source was submitted, indicating an intention to clear the wishlist
    if (newWishlistSource === '' && newWishlistSource !== existingWishListSource) {
      dispatch(clearWishLists());
      return;
    }

    const wishlistToFetch = newWishlistSource ?? existingWishListSource;
    // done if there's neither an existing nor new URL
    if (!wishlistToFetch) {
      return;
    }

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

    // Pipe | separated URLs
    const wishlistUrlsToFetch = validateWishListURLs(wishlistToFetch);
    const wishListResults = await Promise.allSettled(
      wishlistUrlsToFetch.map(async (url) => {
        const res = await fetch(url);
        if (res.status < 200 || res.status >= 300) {
          throw await toHttpStatusError(res);
        }
        return res.text();
      }),
    );

    const wishLists: [url: string, text: string][] = [];
    let hasSuccess = false;
    for (let i = 0; i < wishlistUrlsToFetch.length; i++) {
      const url = wishlistUrlsToFetch[i];
      const result = wishListResults[i];
      if (result.status === 'rejected') {
        showNotification({
          type: 'warning',
          title: t('WishListRoll.Header'),
          body: t('WishListRoll.ImportError', { url, error: errorMessage(result.reason) }),
        });
        errorLog(TAG, 'Unable to load wish list', url, result.reason);
      } else if (result.status === 'fulfilled') {
        hasSuccess = true;
        wishLists.push([url, result.value]);
      }
    }

    if (!hasSuccess) {
      // Give up if we couldn't fetch any of the lists
      return;
    }

    // if this is a new wishlist, set the setting now that we know at least one list is fetchable
    if (newWishlistSource && hasSuccess) {
      dispatch(setSettingAction('wishListSource', newWishlistSource));
    }

    const wishListAndInfo = toWishList(wishLists);
    wishListAndInfo.source = wishlistToFetch;

    // Only update if the length changed. The wish list may actually be different - we don't do a deep check -
    // but this is good enough to avoid re-doing the work over and over.
    // If the user manually refreshed, do the work anyway
    if (
      loadedWishListRolls?.length !== wishListAndInfo.wishListRolls.length ||
      wishListURLsChanged ||
      manualRefresh
    ) {
      await dispatch(transformAndStoreWishList(wishListAndInfo));
    } else {
      infoLog(TAG, 'Refreshed wishlist, but it matched the one we already have');
      dispatch(touchWishLists());
    }
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
        const urls = once(() => validateWishListURLs(wishListState.wishListAndInfo.source!));
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
