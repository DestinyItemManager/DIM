import React, { useEffect } from 'react';
import ItemPopupContainer from '../item-popup/ItemPopupContainer';
import ItemPickerContainer from '../item-picker/ItemPickerContainer';
import MoveAmountPopupContainer from '../inventory/MoveAmountPopupContainer';
import { t } from 'app/i18next-t';
import { itemTagList } from '../inventory/dim-item-info';
import { Hotkey } from '../hotkeys/hotkeys';
import { connect } from 'react-redux';
import { loadVendorDropsFromIndexedDB } from 'app/vendorEngramsXyzApi/reducer';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { DimError } from 'app/bungie-api/bungie-service-helper';
import ErrorPanel from './ErrorPanel';
import { PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { getToken } from 'app/bungie-api/oauth-tokens';
import { AppIcon, banIcon } from './icons';
import { fetchWishList } from 'app/wishlists/wishlist-fetch';
import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { accountsSelector, accountsLoadedSelector } from 'app/accounts/selectors';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { Switch, Route, Redirect, useRouteMatch } from 'react-router';
import { setActivePlatform, getPlatforms } from 'app/accounts/platforms';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { useHotkeys } from 'app/hotkeys/useHotkey';

// TODO: Could be slightly better to group these a bit, but for now we break them each into a separate chunk.
const Inventory = React.lazy(() =>
  import(/* webpackChunkName: "inventory" */ 'app/inventory/Inventory')
);
const Progress = React.lazy(() =>
  import(/* webpackChunkName: "progress" */ 'app/progress/Progress')
);
const LoadoutBuilderContainer = React.lazy(() =>
  import(/* webpackChunkName: "loadoutBuilder" */ 'app/loadout-builder/LoadoutBuilderContainer')
);
const D1LoadoutBuilder = React.lazy(() =>
  import(/* webpackChunkName: "d1LoadoutBuilder" */ 'app/destiny1/loadout-builder/D1LoadoutBuilder')
);
const Vendors = React.lazy(async () => ({
  default: (await import(/* webpackChunkName: "vendors" */ 'app/vendors/components')).Vendors,
}));
const SingleVendor = React.lazy(async () => ({
  default: (await import(/* webpackChunkName: "vendors" */ 'app/vendors/components')).SingleVendor,
}));
const D1Vendors = React.lazy(() =>
  import(/* webpackChunkName: "d1vendors" */ 'app/destiny1/vendors/D1Vendors')
);
const RecordBooks = React.lazy(() =>
  import(/* webpackChunkName: "recordbooks" */ 'app/destiny1/record-books/RecordBooks')
);
const Organizer = React.lazy(() =>
  import(/* webpackChunkName: "organizer" */ 'app/organizer/Organizer')
);
const Activities = React.lazy(() =>
  import(/* webpackChunkName: "activities" */ 'app/destiny1/activities/Activities')
);
const Collections = React.lazy(() =>
  import(/* webpackChunkName: "collections" */ 'app/collections/Collections')
);

interface ProvidedProps {
  destinyVersion: DestinyVersion;
  platformMembershipId: string;
}

interface StoreProps {
  accountsLoaded: boolean;
  account?: DestinyAccount;
  profileError?: DimError;
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
    if ($featureFlags.vendorEngrams && isD2) {
      dispatch(loadVendorDropsFromIndexedDB());
    }
  }, [dispatch, isD2]);

  const { path, url } = useRouteMatch();

  // Define some hotkeys without implementation, so they show up in the help
  const hotkeys: Hotkey[] = [
    {
      combo: 't',
      description: t('Hotkey.ToggleDetails'),
      callback() {
        // Empty - this gets redefined in dimMoveItemProperties
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

  if (profileError) {
    const isManifestError = profileError.name === 'ManifestError';
    const token = getToken()!;
    return (
      <div className="dim-page">
        <ErrorPanel
          title={
            isManifestError ? t('Accounts.ErrorLoadManifest') : t('Accounts.ErrorLoadInventory')
          }
          error={profileError}
          showTwitters={true}
          showReload={true}
        >
          {!isManifestError &&
            account.destinyVersion === 1 &&
            profileError.code === PlatformErrorCodes.DestinyUnexpectedError && (
              <p>
                <ExternalLink
                  className="dim-button"
                  href={`https://www.bungie.net/en/Profile/Settings/254/${token.bungieMembershipId}?category=Accounts`}
                >
                  <AppIcon icon={banIcon} /> {t('Accounts.UnlinkTwitchButton')}
                </ExternalLink>{' '}
                <b>{t('Accounts.UnlinkTwitch')}</b>
              </p>
            )}
        </ErrorPanel>
      </div>
    );
  }

  return (
    <>
      <div id="content">
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
            <Route path={`${path}/collections`} exact>
              <Collections account={account} />
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
                  vendorHash={match.params.vendorId}
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
      <ItemPopupContainer boundarySelector=".store-header" />
      <ItemPickerContainer />
      <MoveAmountPopupContainer />
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(Destiny);
