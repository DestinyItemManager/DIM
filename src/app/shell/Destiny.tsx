import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { getPlatforms, setActivePlatform } from 'app/accounts/platforms';
import { accountsLoadedSelector, accountsSelector } from 'app/accounts/selectors';
import ArmoryPage from 'app/armory/ArmoryPage';
import Compare from 'app/compare/Compare';
import { settingsSelector } from 'app/dim-api/selectors';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import Farming from 'app/farming/Farming';
import { useHotkeys } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import InfusionFinder from 'app/infuse/InfusionFinder';
import { storesSelector } from 'app/inventory/selectors';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import LoadoutDrawer from 'app/loadout-drawer/LoadoutDrawer';
import { totalPostmasterItems } from 'app/loadout-drawer/postmaster';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { fetchWishList } from 'app/wishlists/wishlist-fetch';
import React, { useEffect } from 'react';
import { connect, useSelector } from 'react-redux';
import { Redirect, Route, Switch, useLocation, useRouteMatch } from 'react-router';
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

interface ProvidedProps {
  destinyVersion: DestinyVersion;
  platformMembershipId: string;
}

interface StoreProps {
  accountsLoaded: boolean;
  account?: DestinyAccount;
  profileError?: Error;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return {
    accountsLoaded: accountsLoadedSelector(state),
    account: accountsSelector(state).find(
      (account) =>
        account.membershipId === props.platformMembershipId &&
        account.destinyVersion === props.destinyVersion
    ),
    profileError: state.inventory.profileError,
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

/**
 * Base view for pages that show Destiny content.
 */
function Destiny({ accountsLoaded, account, dispatch, profileError }: Props) {
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
  const { path, url } = useRouteMatch();

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
      return <Redirect to={pathname.replace(/\/\d+\/d2/, '') + search} />;
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
        <Switch>
          <Route path={`${path}/inventory`} exact>
            <Inventory account={account} />
          </Route>
          {account.destinyVersion === 2 && (
            <Route path={`${path}/progress`} exact>
              <Progress account={account} />
            </Route>
          )}
          {account.destinyVersion === 2 && (
            <Route path={`${path}/records`} exact>
              <Records account={account} />
            </Route>
          )}
          <Route path={`${path}/optimizer`} exact>
            {account.destinyVersion === 2 ? (
              <LoadoutBuilderContainer account={account} />
            ) : (
              <D1LoadoutBuilder />
            )}
          </Route>
          <Route path={`${path}/organizer`} exact>
            <Organizer account={account} />
          </Route>
          {account.destinyVersion === 2 && (
            <Route
              path={`${path}/vendors/:vendorId`}
              exact
              render={({ match }) => (
                <SingleVendor
                  key={match.params.vendorId}
                  account={account}
                  vendorHash={parseInt(match.params.vendorId!, 10)}
                />
              )}
            />
          )}
          <Route path={`${path}/vendors`} exact>
            {account.destinyVersion === 2 ? (
              <Vendors account={account} />
            ) : (
              <D1Vendors account={account} />
            )}
          </Route>
          {account.destinyVersion === 2 && (
            <Route
              path={`${path}/armory/:itemHash`}
              exact
              render={({ match }) => (
                <ArmoryPage
                  key={match.params.itemHash}
                  account={account}
                  itemHash={parseInt(match.params.itemHash!, 10)}
                />
              )}
            />
          )}
          {account.destinyVersion === 1 && (
            <Route path={`${path}/record-books`} exact>
              <RecordBooks account={account} />
            </Route>
          )}
          {account.destinyVersion === 1 && (
            <Route path={`${path}/activities`} exact>
              <Activities account={account} />
            </Route>
          )}
          <Route>
            <Redirect to={`${url}/inventory`} />
          </Route>
        </Switch>
      </div>
      <LoadoutDrawer />
      <Compare />
      <Farming />
      <InfusionFinder destinyVersion={account.destinyVersion} />
      <ItemPopupContainer boundarySelector=".store-header" />
      <ItemPickerContainer />
      <GlobalEffects />
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(Destiny);

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

  const badgePostmaster = useSelector(
    (state: RootState) => settingsSelector(state).badgePostmaster
  );

  // Badge the app icon with the number of postmaster items
  useEffect(() => {
    if (stores.length > 0 && badgePostmaster && 'setAppBadge' in navigator) {
      const activeStore = getCurrentStore(stores)!;
      navigator.setAppBadge(totalPostmasterItems(activeStore));
    }
  }, [badgePostmaster, stores]);

  return null;
}
