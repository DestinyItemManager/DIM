import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import SelectAccount from 'app/accounts/SelectAccount';
import { getPlatforms, setActivePlatform } from 'app/accounts/platforms';
import {
  accountsLoadedSelector,
  accountsSelector,
  currentAccountSelector,
} from 'app/accounts/selectors';
import ArmoryPage from 'app/armory/ArmoryPage';
import CompareContainer from 'app/compare/CompareContainer';
import { settingSelector } from 'app/dim-api/selectors';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import Farming from 'app/farming/Farming';
import { useHotkey, useHotkeys } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import InfusionFinder from 'app/infuse/InfusionFinder';
import { ItemDragPreview } from 'app/inventory/ItemDragPreview';
import SyncTagLock from 'app/inventory/SyncTagLock';
import { blockingProfileErrorSelector, storesSelector } from 'app/inventory/selectors';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import ItemFeedPage from 'app/item-feed/ItemFeedPage';
import LoadoutDrawerContainer from 'app/loadout-drawer/LoadoutDrawerContainer';
import { totalPostmasterItems } from 'app/loadout-drawer/postmaster';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import StripSockets from 'app/strip-sockets/StripSockets';
import { setAppBadge } from 'app/utils/app-badge';
import { noop } from 'app/utils/functions';
import SingleVendorSheetContainer from 'app/vendors/single-vendor/SingleVendorSheetContainer';
import { fetchWishList } from 'app/wishlists/wishlist-fetch';
import { lazy, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { Hotkey } from '../hotkeys/hotkeys';
import { itemTagList } from '../inventory/dim-item-info';
import ItemPickerContainer from '../item-picker/ItemPickerContainer';
import ItemPopupContainer from '../item-popup/ItemPopupContainer';
import * as styles from './Destiny.m.scss';
import ErrorPanel from './ErrorPanel';

// TODO: Could be slightly better to group these a bit, but for now we break them each into a separate chunk.
const Inventory = lazy(
  () => import(/* webpackChunkName: "inventory" */ 'app/inventory-page/Inventory'),
);
const Progress = lazy(() => import(/* webpackChunkName: "progress" */ 'app/progress/Progress'));
const LoadoutBuilderContainer = lazy(
  () =>
    import(/* webpackChunkName: "loadoutBuilder" */ 'app/loadout-builder/LoadoutBuilderContainer'),
);
const D1LoadoutBuilder = lazy(
  () =>
    import(
      /* webpackChunkName: "d1LoadoutBuilder" */ 'app/destiny1/loadout-builder/D1LoadoutBuilder'
    ),
);
const Vendors = lazy(async () => import(/* webpackChunkName: "vendors" */ 'app/vendors/Vendors'));
const SingleVendorPage = lazy(
  async () =>
    import(/* webpackChunkName: "vendors" */ 'app/vendors/single-vendor/SingleVendorPage'),
);
const D1Vendors = lazy(
  () => import(/* webpackChunkName: "d1vendors" */ 'app/destiny1/vendors/D1Vendors'),
);
const RecordBooks = lazy(
  () => import(/* webpackChunkName: "recordbooks" */ 'app/destiny1/record-books/RecordBooks'),
);
const Organizer = lazy(() => import(/* webpackChunkName: "organizer" */ 'app/organizer/Organizer'));
const Activities = lazy(
  () => import(/* webpackChunkName: "activities" */ 'app/destiny1/activities/Activities'),
);
const Records = lazy(() => import(/* webpackChunkName: "records" */ 'app/records/Records'));
const Loadouts = lazy(() => import(/* webpackChunkName: "loadouts" */ 'app/loadout/Loadouts'));

const SearchHistory = lazy(
  () => import(/* webpackChunkName: "searchHistory" */ '../search/SearchHistory'),
);

/**
 * Base view for pages that show Destiny content.
 */
export default function Destiny() {
  const dispatch = useThunkDispatch();
  const { destinyVersion: destinyVersionString, membershipId: platformMembershipId } = useParams();
  const destinyVersion = parseInt(
    (destinyVersionString || 'd2').replace('d', ''),
    10,
  ) as DestinyVersion;
  const accountsLoaded = useSelector(accountsLoadedSelector);
  const currentAccount = useSelector(currentAccountSelector);
  const account = useSelector((state: RootState) =>
    accountsSelector(state).find(
      (account) =>
        account.membershipId === platformMembershipId && account.destinyVersion === destinyVersion,
    ),
  );
  const profileError = useSelector(blockingProfileErrorSelector);
  const autoLockTagged = useSelector(settingSelector('autoLockTagged'));

  useEffect(() => {
    if (!accountsLoaded) {
      dispatch(getPlatforms);
    }
  }, [dispatch, accountsLoaded]);

  useEffect(() => {
    if (account) {
      dispatch(setActivePlatform(account));
    }
  }, [account, dispatch]);

  const isD2 = account?.destinyVersion === 2;
  useEffect(() => {
    if ($featureFlags.wishLists && isD2) {
      dispatch(fetchWishList());
    }
  }, [dispatch, isD2]);

  const { pathname, search } = useLocation();

  // Define some hotkeys without implementation, so they show up in the help
  useHotkey('c', t('Compare.ButtonHelp'), noop);
  useHotkey('l', t('Hotkey.LockUnlock'), noop);
  useHotkey('k', t('MovePopup.ToggleSidecar'), noop);
  useHotkey('v', t('Hotkey.Vault'), noop);
  useHotkey('p', t('Hotkey.Pull'), noop);
  useHotkey('i', t('MovePopup.InfuseTitle'), noop);
  useHotkey('a', t('Hotkey.Armory'), noop);
  useHotkey('shift+0', t('Tags.ClearTag'), noop);

  const hotkeys = useMemo(() => {
    const hotkeys: Hotkey[] = [];
    for (const tag of itemTagList) {
      if (tag.hotkey) {
        hotkeys.push({
          combo: tag.hotkey,
          description: t('Hotkey.MarkItemAs', {
            tag: t(tag.label),
          }),
          callback() {
            // Empty - this gets redefined in item-tag.component.ts
          },
        });
      }
    }
    return hotkeys;
  }, []);
  useHotkeys(hotkeys);

  if (
    !accountsLoaded ||
    // This delays to wait for current account to be set in Redux so we don't get ahead of ourselves
    (account && !currentAccount)
  ) {
    return <ShowPageLoading message={t('Loading.Accounts')} />;
  }

  if (!account) {
    if (pathname.includes('/armory/')) {
      return <Navigate to={pathname.replace(/\/\d+\/d2/, '') + search} replace />;
    } else {
      return (
        <div className="dim-page">
          <ErrorPanel
            title={t('Accounts.MissingTitle')}
            fallbackMessage={t('Accounts.MissingDescription')}
          />
          <SelectAccount path="/" />
        </div>
      );
    }
  }

  if (profileError) {
    const isManifestError = profileError.name === 'ManifestError';
    return (
      <div className="dim-page">
        <ErrorPanel
          title={
            isManifestError
              ? t('Accounts.ErrorLoadManifest')
              : t('Accounts.ErrorLoadInventory', { version: account.destinyVersion })
          }
          error={profileError}
          showSocials
          showReload
        />
      </div>
    );
  }

  return (
    <ItemPickerContainer>
      <SingleVendorSheetContainer>
        <div className={styles.content}>
          <Routes>
            <Route
              path="inventory"
              element={
                <ErrorBoundary name="inventory" key="inventory">
                  <Inventory account={account} />
                </ErrorBoundary>
              }
            />
            {account.destinyVersion === 2 && (
              <Route
                path="progress"
                element={
                  <ErrorBoundary name="progress" key="progress">
                    <Progress account={account} />
                  </ErrorBoundary>
                }
              />
            )}
            {account.destinyVersion === 2 && (
              <Route
                path="records"
                element={
                  <ErrorBoundary name="records" key="records">
                    <Records account={account} />
                  </ErrorBoundary>
                }
              />
            )}
            <Route
              path="optimizer"
              element={
                <ErrorBoundary name="optimizer" key="optimizer">
                  {account.destinyVersion === 2 ? (
                    <LoadoutBuilderContainer account={account} />
                  ) : (
                    <D1LoadoutBuilder account={account} />
                  )}
                </ErrorBoundary>
              }
            />
            {account.destinyVersion === 2 && (
              <Route
                path="loadouts"
                element={
                  <ErrorBoundary name="loadouts" key="loadouts">
                    <Loadouts account={account} />
                  </ErrorBoundary>
                }
              />
            )}
            <Route
              path="organizer"
              element={
                <ErrorBoundary name="organizer" key="organizer">
                  <Organizer account={account} />
                </ErrorBoundary>
              }
            />
            {account.destinyVersion === 2 && (
              <Route
                path="vendors/:vendorHash"
                element={
                  <ErrorBoundary name="singleVendor" key="singleVendor">
                    <SingleVendorPage account={account} />
                  </ErrorBoundary>
                }
              />
            )}
            <Route
              path="vendors"
              element={
                <ErrorBoundary name="vendors" key="vendors">
                  {account.destinyVersion === 2 ? (
                    <Vendors account={account} />
                  ) : (
                    <D1Vendors account={account} />
                  )}
                </ErrorBoundary>
              }
            />
            {account.destinyVersion === 2 && (
              <Route
                path="armory/:itemHash"
                element={
                  <ErrorBoundary name="armory" key="armory">
                    <ArmoryPage account={account} />
                  </ErrorBoundary>
                }
              />
            )}
            {account.destinyVersion === 2 && (
              <Route
                path="item-feed"
                element={
                  <ErrorBoundary name="itemFeed" key="itemFeed">
                    <ItemFeedPage account={account} />
                  </ErrorBoundary>
                }
              />
            )}
            {account.destinyVersion === 1 && (
              <Route
                path="record-books"
                element={
                  <ErrorBoundary name="recordBooks" key="recordBooks">
                    <RecordBooks account={account} />
                  </ErrorBoundary>
                }
              />
            )}
            {account.destinyVersion === 1 && (
              <Route
                path="activities"
                element={
                  <ErrorBoundary name="activities" key="activities">
                    <Activities account={account} />
                  </ErrorBoundary>
                }
              />
            )}

            <Route
              path="search-history"
              element={
                <ErrorBoundary name="searchHistory" key="searchHistory">
                  <SearchHistory />
                </ErrorBoundary>
              }
            />
            <Route path="*" element={<Navigate to="../inventory" />} />
          </Routes>
        </div>
        <LoadoutDrawerContainer account={account} />
        <CompareContainer destinyVersion={account.destinyVersion} />
        {account.destinyVersion === 2 && <StripSockets />}
        <Farming />
        <InfusionFinder />
        <ItemPopupContainer boundarySelector=".store-header" />
        <GlobalEffects />
        {Boolean(autoLockTagged) && <SyncTagLock />}
        <ItemDragPreview />
      </SingleVendorSheetContainer>
    </ItemPickerContainer>
  );
}

/**
 * Set some global CSS properties and such in reaction to the store.
 */
function GlobalEffects() {
  const stores = useSelector(storesSelector);

  // Set a CSS var for how many characters there are
  useEffect(() => {
    if (stores.length > 1) {
      document
        .querySelector('html')!
        .style.setProperty('--num-characters', String(stores.length - 1));
    }
  }, [stores.length]);

  const badgePostmaster = useSelector(settingSelector('badgePostmaster'));

  // Badge the app icon with the number of postmaster items
  useEffect(() => {
    if (stores.length > 0 && badgePostmaster) {
      const activeStore = getCurrentStore(stores);
      activeStore && setAppBadge(totalPostmasterItems(activeStore));
    }
  }, [badgePostmaster, stores]);

  return null;
}
