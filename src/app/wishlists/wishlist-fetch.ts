import { toWishList } from './wishlist-file';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { showNotification } from 'app/notifications/notifications';
import { loadWishLists } from './actions';
import store from 'app/store/store';
import { ThunkResult, RootState } from 'app/store/reducers';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';

export function fetchWishList(showAlert: boolean): ThunkResult<Promise<void>> {
  return async (dispatch, getState) => {
    const wishListSource = getState().settings.wishListSource;

    if (!wishListSource) {
      return;
    }

    fetch(wishListSource)
      .then((result) => result.text())
      .then((resultText) =>
        transformAndStoreWishList(resultText, 'Fetch Wish List', showAlert, dispatch)
      );
  };
}

export function transformAndStoreWishList(
  wishListResult: string,
  eventName: string,
  showAlert?: boolean,
  dispatch?: ThunkDispatch<RootState, {}, AnyAction>
) {
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
