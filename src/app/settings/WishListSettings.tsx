import { settingSelector } from 'app/dim-api/selectors';
import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import { PressTip } from 'app/dim-ui/PressTip';
import { I18nKey, t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { AppIcon, banIcon, deleteIcon, plusIcon } from 'app/shell/icons';
import { wishListGuideLink } from 'app/shell/links';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { errorMessage } from 'app/utils/errors';
import { builtInWishlists, validateWishListURLs, wishListAllowedHosts } from 'app/wishlists/utils';
import { fetchWishList, transformAndStoreWishList } from 'app/wishlists/wishlist-fetch';
import { toWishList } from 'app/wishlists/wishlist-file';
import { useEffect, useState } from 'react';
import { DropzoneOptions } from 'react-dropzone';
import { useSelector } from 'react-redux';
import FileUpload from '../dim-ui/FileUpload';
import HelpLink from '../dim-ui/HelpLink';
import { clearWishLists } from '../wishlists/actions';
import { wishListsLastFetchedSelector, wishListsSelector } from '../wishlists/selectors';
import Checkbox from './Checkbox';
import { fineprintClass, horizontalClass, settingClass } from './SettingsPage';
import styles from './WishListSettings.m.scss';
import { Settings } from './initial-settings';

export default function WishListSettings() {
  const dispatch = useThunkDispatch();
  const settingsWishListSource = useSelector(settingSelector('wishListSource'));
  const wishListLastUpdated = useSelector(wishListsLastFetchedSelector);
  const wishList = useSelector(wishListsSelector).wishListAndInfo;
  const numWishListRolls = wishList.wishListRolls.length;
  useEffect(() => {
    dispatch(fetchWishList());
  }, [dispatch]);

  const activeWishlistUrls = settingsWishListSource
    ? settingsWishListSource.split('|').map((url) => url.trim())
    : [];

  const reloadWishList = async (reloadWishListSource: string | undefined) => {
    try {
      await dispatch(fetchWishList(reloadWishListSource));
    } catch (e) {
      showNotification({
        type: 'error',
        title: t('WishListRoll.Header'),
        body: t('WishListRoll.ImportError', { error: errorMessage(e) }),
      });
    }
  };

  const loadWishList: DropzoneOptions['onDrop'] = (acceptedFiles) => {
    const reader = new FileReader();
    reader.onload = async () => {
      if (reader.result && typeof reader.result === 'string') {
        const wishListAndInfo = toWishList([undefined, reader.result]);
        if (wishListAndInfo.wishListRolls.length) {
          dispatch(clearWishLists());
        }
        // Still attempt to store even with 0 rolls to show an error message
        dispatch(transformAndStoreWishList(wishListAndInfo));
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
    dispatch(clearWishLists());
  };

  const changeUrl = (url: string, enabled: boolean) => {
    const toAddOrRemove = validateWishListURLs(url);
    const newUrls = enabled
      ? [...activeWishlistUrls, ...toAddOrRemove.filter((url) => !activeWishlistUrls.includes(url))]
      : [...activeWishlistUrls.filter((url) => !toAddOrRemove.includes(url))];
    reloadWishList(newUrls.join('|'));
  };

  const addUrlDisabled = (url: string) => {
    const urls = validateWishListURLs(url);
    if (!urls.length) {
      return `${t('WishListRoll.InvalidExternalSource')}\n${wishListAllowedHosts
        .map((h) => `https://${h}`)
        .join('\n')}`;
    }
    if (!urls.some((url) => !activeWishlistUrls.includes(url))) {
      return t('WishListRoll.SourceAlreadyAdded');
    }
    return false;
  };

  const disabledBuiltinLists = builtInWishlists.filter(
    (list) => !activeWishlistUrls.includes(list.url),
  );

  return (
    <section id="wishlist">
      <h2>
        {t('WishListRoll.Header')} <HelpLink helpLink={wishListGuideLink} />
      </h2>

      {numWishListRolls > 0 && (
        <div className={settingClass}>
          <div className={horizontalClass}>
            <label>
              {t('WishListRoll.Num', {
                num: numWishListRolls,
              })}
            </label>
            <button type="button" className="dim-button" onClick={clearWishListEvent}>
              <AppIcon icon={banIcon} /> {t('WishListRoll.Clear')}
            </button>
          </div>
          {wishListLastUpdated && (
            <div className={fineprintClass}>
              {t('WishListRoll.LastUpdated', {
                lastUpdatedDate: wishListLastUpdated.toLocaleDateString(),
                lastUpdatedTime: wishListLastUpdated.toLocaleTimeString(),
              })}
            </div>
          )}
        </div>
      )}

      {activeWishlistUrls.map((url) => {
        const loadedData = wishList.infos.find((info) => info.url === url);
        const builtinEntry = builtInWishlists.find((list) => list.url === url);
        if (builtinEntry) {
          return (
            <BuiltinWishlist
              key={url}
              name={builtinEntry.name}
              title={loadedData?.title}
              description={loadedData?.description}
              rollsCount={loadedData?.numRolls}
              checked={true}
              onChange={(checked) => changeUrl(url, checked)}
            />
          );
        } else {
          return (
            <UrlWishlist
              key={url}
              url={url}
              title={loadedData?.title}
              description={loadedData?.description}
              rollsCount={loadedData?.numRolls}
              onRemove={() => changeUrl(url, false)}
            />
          );
        }
      })}

      {disabledBuiltinLists.map((list) => (
        <BuiltinWishlist
          key={list.url}
          name={list.name}
          title={undefined}
          description={undefined}
          checked={false}
          rollsCount={undefined}
          onChange={(checked) => changeUrl(list.url, checked)}
        />
      ))}

      <NewUrlWishlist
        addWishlistDisabled={addUrlDisabled}
        onAddWishlist={(url) => changeUrl(url, true)}
      />

      <div className={settingClass}>
        <FileUpload onDrop={loadWishList} title={t('WishListRoll.Import')} />
      </div>
    </section>
  );
}

function BuiltinWishlist({
  name,
  title,
  description,
  rollsCount,
  checked,
  onChange,
}: {
  name: I18nKey;
  title: string | undefined;
  description: string | undefined;
  rollsCount: number | undefined;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={settingClass}>
      <Checkbox label={t(name)} name={name as keyof Settings} value={checked} onChange={onChange} />
      {rollsCount !== undefined && t('WishListRoll.NumRolls', { num: rollsCount })}
      {(title || description) && (
        <div className={fineprintClass}>
          <b>{title}</b>
          <br />
          {description}
        </div>
      )}
    </div>
  );
}

function UrlWishlist({
  url,
  title,
  description,
  rollsCount,
  onRemove,
}: {
  url: string;
  title: string | undefined;
  description: string | undefined;
  rollsCount: number | undefined;
  onRemove: () => void;
}) {
  return (
    <div className={settingClass}>
      <label>{title || url}</label>
      <ConfirmButton key="delete" danger onClick={onRemove}>
        <AppIcon icon={deleteIcon} title={t('Loadouts.Delete')} />
      </ConfirmButton>
      {!title && <div className={fineprintClass}>{url}</div>}
      {rollsCount !== undefined && t('WishListRoll.NumRolls', { num: rollsCount })}
      {description && <div className={fineprintClass}>{description}</div>}
    </div>
  );
}

function NewUrlWishlist({
  addWishlistDisabled,
  onAddWishlist,
}: {
  addWishlistDisabled: (url: string) => string | false;
  onAddWishlist: (url: string) => void;
}) {
  const [newWishlistSource, setNewWishlistSource] = useState('');
  const canAddError = addWishlistDisabled(newWishlistSource);
  const disabled = canAddError !== false;
  return (
    <div className={settingClass}>
      <div>{t('WishListRoll.ExternalSource')}</div>
      <div>
        <input
          type="text"
          className={styles.text}
          value={newWishlistSource}
          onChange={(e) => setNewWishlistSource(e.target.value)}
          placeholder={t('WishListRoll.ExternalSourcePlaceholder')}
        />
      </div>
      <div className={styles.tooltipDiv}>
        <PressTip tooltip={canAddError !== undefined ? canAddError : undefined}>
          <button
            type="button"
            className="dim-button"
            disabled={disabled}
            onClick={() => {
              onAddWishlist(newWishlistSource);
              setNewWishlistSource('');
            }}
          >
            <AppIcon icon={plusIcon} /> {t('WishListRoll.UpdateExternalSource')}
          </button>
        </PressTip>
      </div>
    </div>
  );
}
