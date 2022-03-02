import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { getPlatforms, setActivePlatform } from 'app/accounts/platforms';
import { accountsLoadedSelector, accountsSelector } from 'app/accounts/selectors';
import ArmoryPage from 'app/armory/ArmoryPage';
import Compare from 'app/compare/Compare';
import LoadoutDrawer from 'app/destiny1/loadout-drawer/LoadoutDrawer';
import { settingSelector } from 'app/dim-api/selectors';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import Farming from 'app/farming/Farming';
import { useHotkeys } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import InfusionFinder from 'app/infuse/InfusionFinder';
import { storesSelector } from 'app/inventory/selectors';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import ItemFeedPage from 'app/item-feed/ItemFeedPage';
import LoadoutDrawer2 from 'app/loadout/loadout-edit/LoadoutDrawer2';
import { totalPostmasterItems } from 'app/loadout/postmaster';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import { setAppBadge } from 'app/utils/app-badge';
import { fetchWishList } from 'app/wishlists/wishlist-fetch';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { Hotkey } from '../hotkeys/hotkeys';
import { itemTagList } from '../inventory/dim-item-info';
import ItemPickerContainer from '../item-picker/ItemPickerContainer';
import ItemPopupContainer from '../item-popup/ItemPopupContainer';
import styles from './Destiny.m.scss';
import ErrorPanel from './ErrorPanel';

// TODO: Could be slightly better to group these a bit, but for now we break them each into a separate chunk.
const Inventory = React.lazy(
  () => import(/* webpackChunkName: "inventory" */ 'app/inventory/Inventory')
);
const Progress = React.lazy(
  () => import(/* webpackChunkName: "progress" */ 'app/progress/Progress')
);
const LoadoutBuilderContainer = React.lazy(
  () =>
    import(/* webpackChunkName: "loadoutBuilder" */ 'app/loadout-builder/LoadoutBuilderContainer')
);
const D1LoadoutBuilder = React.lazy(
  () =>
    import(
      /* webpackChunkName: "d1LoadoutBuilder" */ 'app/destiny1/loadout-builder/D1LoadoutBuilder'
    )
);
const Vendors = React.lazy(async () => ({
  default: (await import(/* webpackChunkName: "vendors" */ 'app/vendors/components')).Vendors,
}));
const SingleVendor = React.lazy(async () => ({
  default: (await import(/* webpackChunkName: "vendors" */ 'app/vendors/components')).SingleVendor,
}));
const D1Vendors = React.lazy(
  () => import(/* webpackChunkName: "d1vendors" */ 'app/destiny1/vendors/D1Vendors')
);
const RecordBooks = React.lazy(
  () => import(/* webpackChunkName: "recordbooks" */ 'app/destiny1/record-books/RecordBooks')
);
const Organizer = React.lazy(
  () => import(/* webpackChunkName: "organizer" */ 'app/organizer/Organizer')
);
const Activities = React.lazy(
  () => import(/* webpackChunkName: "activities" */ 'app/destiny1/activities/Activities')
);
const Records = React.lazy(() => import(/* webpackChunkName: "records" */ 'app/records/Records'));
const Loadouts = React.lazy(
  () => import(/* webpackChunkName: "loadouts" */ 'app/loadout/loadouts-page/Loadouts')
);

/**
 * Base view for pages that show Destiny content.
 */
export default function Destiny() {
  const dispatch = useThunkDispatch();
  const { destinyVersion: destinyVersionString, membershipId: platformMembershipId } = useParams();
  const destinyVersion = parseInt(destinyVersionString || '2', 10) as DestinyVersion;
  const accountsLoaded = useSelector(accountsLoadedSelector);
  const account = useSelector((state: RootState) =>
    accountsSelector(state).find(
      (account) =>
        account.membershipId === platformMembershipId && account.destinyVersion === destinyVersion
    )
  );
  const profileError = useSelector((state: RootState) => state.inventory.profileError);

  useEffect(() => {
    if (!accountsLoaded) {
      dispatch(getPlatforms());
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
  const hotkeys: Hotkey[] = [
    {
      combo: 'c',
      description: t('Compare.ButtonHelp'),
      callback() {
        // Empty
      },
    },
    {
      combo: 'l',
      description: t('Hotkey.LockUnlock'),
      callback() {
        // Empty
      },
    },
    {
      combo: 'k',
      description: t('MovePopup.ToggleSidecar'),
      callback() {
        // Empty
      },
    },
    {
      combo: 'v',
      description: t('Hotkey.Vault'),
      callback() {
        // Empty
      },
    },
    {
      combo: 'p',
      description: t('Hotkey.Pull'),
      callback() {
        // Empty
      },
    },
    {
      combo: 'shift+0',
      description: t('Tags.ClearTag'),
      callback() {
        // Empty
      },
    },
  ];

  itemTagList.forEach((tag) => {
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
  });
  useHotkeys(hotkeys);

  if (!account) {
    if (pathname.includes('/armory/')) {
      return <Navigate to={pathname.replace(/\/\d+\/d2/, '') + search} replace />;
    } else {
      return accountsLoaded ? (
        <div className="dim-page">
          <ErrorPanel
            title={t('Accounts.MissingTitle')}
            fallbackMessage={t('Accounts.MissingDescription')}
            showTwitters={true}
          />
        </div>
      ) : (
        <ShowPageLoading message={t('Loading.Accounts')} />
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
          showTwitters={true}
          showReload={true}
        />
      </div>
    );
  }

  return (
    <>
      <div className={styles.content}>
        <Routes>
          <Route path="inventory" element={<Inventory account={account} />} />
          {account.destinyVersion === 2 && (
            <Route path="progress" element={<Progress account={account} />} />
          )}
          {account.destinyVersion === 2 && (
            <Route path="records" element={<Records account={account} />} />
          )}
          <Route
            path="optimizer"
            element={
              account.destinyVersion === 2 ? (
                <LoadoutBuilderContainer account={account} />
              ) : (
                <D1LoadoutBuilder />
              )
            }
          />
          {account.destinyVersion === 2 && (
            <Route path="loadouts" element={<Loadouts account={account} />} />
          )}
          <Route path="organizer" element={<Organizer account={account} />} />
          {account.destinyVersion === 2 && (
            <Route path="vendors/:vendorHash" element={<SingleVendor account={account} />} />
          )}
          <Route
            path="vendors"
            element={
              account.destinyVersion === 2 ? (
                <Vendors account={account} />
              ) : (
                <D1Vendors account={account} />
              )
            }
          />
          {account.destinyVersion === 2 && (
            <Route path="armory/:itemHash" element={<ArmoryPage account={account} />} />
          )}
          {account.destinyVersion === 2 && (
            <Route path="item-feed" element={<ItemFeedPage account={account} />} />
          )}
          {account.destinyVersion === 1 && (
            <Route path="record-books" element={<RecordBooks account={account} />} />
          )}
          {account.destinyVersion === 1 && (
            <Route path="activities" element={<Activities account={account} />} />
          )}
          <Route path="*" element={<Navigate to="inventory" />} />
        </Routes>
      </div>
      {$featureFlags.loadoutDrawerV2 && account.destinyVersion === 2 ? (
        <LoadoutDrawer2 />
      ) : (
        <LoadoutDrawer />
      )}
      <Compare />
      <Farming />
      <InfusionFinder />
      <ItemPopupContainer boundarySelector=".store-header" />
      <ItemPickerContainer />
      <GlobalEffects />
    </>
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
      const activeStore = getCurrentStore(stores)!;
      setAppBadge(totalPostmasterItems(activeStore));
    }
  }, [badgePostmaster, stores]);

  return null;
}
