import React, { useEffect, useState } from 'react';
import { t } from 'app/i18next-t';
import { connect } from 'react-redux';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { clearWishLists } from '../wishlists/actions';
import HelpLink from '../dim-ui/HelpLink';
import { DropzoneOptions } from 'react-dropzone';
import FileUpload from '../dim-ui/FileUpload';
import {
  wishListsEnabledSelector,
  wishListsSelector,
  wishListsLastFetchedSelector,
} from '../wishlists/reducer';
import _ from 'lodash';
import { transformAndStoreWishList, fetchWishList } from 'app/wishlists/wishlist-fetch';
import { isUri } from 'valid-url';
import { toWishList } from 'app/wishlists/wishlist-file';
import { settingsSelector } from './reducer';
import { showNotification } from 'app/notifications/notifications';

// config/content-security-policy.js must be edited alongside this list
export const wishListAllowedPrefixes = [
  'https://raw.githubusercontent.com/',
  'https://gist.githubusercontent.com/',
];
export function isValidWishListUrlDomain(url: string) {
  return isUri(url) && wishListAllowedPrefixes.some((p) => url.startsWith(p));
}

interface StoreProps {
  wishListsEnabled: boolean;
  numWishListRolls: number;
  title?: string;
  description?: string;
  wishListSource: string;
  wishListLastUpdated?: Date;
}

type Props = StoreProps & ThunkDispatchProp;

function mapStateToProps(state: RootState): StoreProps {
  const wishLists = wishListsSelector(state);
  const wishList = wishLists.wishListAndInfo;
  return {
    wishListsEnabled: wishListsEnabledSelector(state),
    numWishListRolls: wishList.wishListRolls.length,
    title: wishList.title,
    description: wishList.description,
    wishListSource: settingsSelector(state).wishListSource,
    wishListLastUpdated: wishListsLastFetchedSelector(state),
  };
}

function WishListSettings({
  wishListsEnabled,
  wishListSource,
  numWishListRolls,
  title,
  description,
  wishListLastUpdated,
  dispatch,
}: Props) {
  const [liveWishListSource, setLiveWishListSource] = useState(wishListSource);
  useEffect(() => {
    dispatch(fetchWishList());
  }, [dispatch]);

  useEffect(() => {
    setLiveWishListSource(wishListSource);
  }, [wishListSource]);

  const wishListUpdateEvent = async () => {
    const newWishListSource = liveWishListSource?.trim();

    try {
      await dispatch(fetchWishList(newWishListSource));
      ga('send', 'event', 'WishList', 'From URL');
    } catch (e) {
      showNotification({
        type: 'error',
        title: t('WishListRoll.Header'),
        body: t('WishListRoll.ImportError', { error: e.message }),
      });
    }
  };

  const loadWishList: DropzoneOptions['onDrop'] = (acceptedFiles) => {
    dispatch(clearWishLists());

    const reader = new FileReader();
    reader.onload = async () => {
      if (reader.result && typeof reader.result === 'string') {
        const wishListAndInfo = toWishList(reader.result);
        dispatch(transformAndStoreWishList(wishListAndInfo));
        ga('send', 'event', 'WishList', 'From File');
      }
    };

    const file = acceptedFiles[0];
    if (file) {
      reader.readAsText(file);
    } else {
      alert(t('WishListRoll.ImportNoFile'));
    }
    return false;
  };

  const clearWishListEvent = () => {
    ga('send', 'event', 'WishList', 'Clear');
    dispatch(clearWishLists());
  };

  const updateWishListSourceState = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSource = e.target.value;
    setLiveWishListSource(newSource);
  };

  return (
    <section id="wishlist">
      <h2>
        {t('WishListRoll.Header')}
        <HelpLink helpLink="https://github.com/DestinyItemManager/DIM/blob/master/docs/COMMUNITY_CURATIONS.md" />
      </h2>
      <div className="setting">
        <FileUpload onDrop={loadWishList} title={t('WishListRoll.Import')} />
      </div>
      <div className="setting">
        <div>{t('WishListRoll.ExternalSource')}</div>
        <div>
          <input
            type="text"
            className="wish-list-text"
            value={liveWishListSource}
            onChange={updateWishListSourceState}
            placeholder={t('WishListRoll.ExternalSource')}
          />
        </div>
        <div>
          <input
            type="button"
            className="dim-button"
            value={t('WishListRoll.UpdateExternalSource')}
            onClick={wishListUpdateEvent}
          />
        </div>
        {wishListLastUpdated && (
          <div className="fineprint">
            {t('WishListRoll.LastUpdated', {
              lastUpdatedDate: wishListLastUpdated.toLocaleDateString(),
              lastUpdatedTime: wishListLastUpdated.toLocaleTimeString(),
            })}
          </div>
        )}
      </div>

      {wishListsEnabled && (
        <div className="setting">
          <div className="horizontal">
            <label>
              {t('WishListRoll.Num', {
                num: numWishListRolls,
              })}
            </label>
            <button type="button" className="dim-button" onClick={clearWishListEvent}>
              {t('WishListRoll.Clear')}
            </button>
          </div>
          {(title || description) && (
            <div className="fineprint">
              {title && (
                <div className="overflow-dots">
                  <b>{title}</b>
                  <br />
                </div>
              )}
              <div className="overflow-dots">{description}</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default connect<StoreProps>(mapStateToProps)(WishListSettings);
