import { settingSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { fetchWishList, transformAndStoreWishList } from 'app/wishlists/wishlist-fetch';
import { toWishList } from 'app/wishlists/wishlist-file';
import React, { useEffect, useState } from 'react';
import { DropzoneOptions } from 'react-dropzone';
import { useSelector } from 'react-redux';
import { isUri } from 'valid-url';
import FileUpload from '../dim-ui/FileUpload';
import HelpLink from '../dim-ui/HelpLink';
import { clearWishLists } from '../wishlists/actions';
import { wishListsLastFetchedSelector, wishListsSelector } from '../wishlists/selectors';

// config/content-security-policy.js must be edited alongside this list
export const wishListAllowedPrefixes = [
  'https://raw.githubusercontent.com/',
  'https://gist.githubusercontent.com/',
];
export function isValidWishListUrlDomain(url: string) {
  return isUri(url) && wishListAllowedPrefixes.some((p) => url.startsWith(p));
}

const voltronLocation =
  'https://raw.githubusercontent.com/48klocs/dim-wish-list-sources/master/voltron.txt';
const choosyVoltronLocation =
  'https://raw.githubusercontent.com/48klocs/dim-wish-list-sources/master/choosy_voltron.txt';

export default function WishListSettings() {
  const dispatch = useThunkDispatch();
  const wishListSource = useSelector(settingSelector('wishListSource'));
  const voltronNotSelected = wishListSource !== voltronLocation;
  const choosyVoltronNotSelected = wishListSource !== choosyVoltronLocation;
  const wishListLastUpdated = useSelector(wishListsLastFetchedSelector);
  const wishList = useSelector(wishListsSelector).wishListAndInfo;
  const numWishListRolls = wishList.wishListRolls.length;
  const [liveWishListSource, setLiveWishListSource] = useState(wishListSource);
  useEffect(() => {
    dispatch(fetchWishList());
  }, [dispatch]);

  useEffect(() => {
    setLiveWishListSource(wishListSource);
  }, [wishListSource]);

  const reloadWishList = async (reloadWishListSource: string | undefined) => {
    try {
      await dispatch(fetchWishList(reloadWishListSource));
      ga('send', 'event', 'WishList', 'From URL');
    } catch (e) {
      showNotification({
        type: 'error',
        title: t('WishListRoll.Header'),
        body: t('WishListRoll.ImportError', { error: e.message }),
      });
    }
  };

  const wishListUpdateEvent = async () => {
    const newWishListSource = liveWishListSource?.trim();

    await reloadWishList(newWishListSource);
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
      showNotification({ type: 'error', title: t('WishListRoll.ImportNoFile') });
    }
    return false;
  };

  const clearWishListEvent = () => {
    ga('send', 'event', 'WishList', 'Clear');
    dispatch(clearWishLists());
  };

  const resetToChoosyVoltron = () => {
    ga('send', 'event', 'WishList', 'Reset to choosy voltron');
    setLiveWishListSource(choosyVoltronLocation);
    reloadWishList(choosyVoltronLocation);
  };

  const resetToVoltron = () => {
    ga('send', 'event', 'WishList', 'Reset to voltron');
    setLiveWishListSource(voltronLocation);
    reloadWishList(voltronLocation);
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
        <div>{t('WishListRoll.PreMadeFiles')}</div>
        {voltronNotSelected && (
          <>
            <div>
              <button type="button" className="dim-button" onClick={resetToVoltron}>
                <span>{t('WishListRoll.Voltron')}</span>
              </button>
            </div>
            <div className="fineprint">{t('WishListRoll.VoltronDescription')}</div>
            {choosyVoltronNotSelected && <p className="fineprint" />}
          </>
        )}
        {choosyVoltronNotSelected && (
          <>
            <div>
              <button type="button" className="dim-button" onClick={resetToChoosyVoltron}>
                <span>{t('WishListRoll.ChoosyVoltron')}</span>
              </button>
            </div>
            <div className="fineprint">{t('WishListRoll.ChoosyVoltronDescription')}</div>
          </>
        )}
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

      {numWishListRolls > 0 && (
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
          {wishList.infos.map(({ title, description, numRolls }, idx) => (
            <div className="fineprint" key={idx}>
              <div>
                <b>{title || t('WishListRoll.Untitled')}</b>{' '}
                {wishList.infos.length > 1 && <i>({numRolls})</i>}
              </div>
              <div>{description}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
