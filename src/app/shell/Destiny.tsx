import React, { useEffect } from 'react';
import ManifestProgress from './ManifestProgress';
import ItemPopupContainer from '../item-popup/ItemPopupContainer';
import ItemPickerContainer from '../item-picker/ItemPickerContainer';
import MoveAmountPopupContainer from '../inventory/MoveAmountPopupContainer';
import { t } from 'app/i18next-t';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import { itemTagList } from '../inventory/dim-item-info';
import { Hotkey } from '../hotkeys/hotkeys';
import { connect } from 'react-redux';
import { loadVendorDropsFromIndexedDB } from 'app/vendorEngramsXyzApi/reducer';
import { ThunkDispatchProp, RootState } from 'app/store/reducers';
import { DimError } from 'app/bungie-api/bungie-service-helper';
import ErrorPanel from './ErrorPanel';
import { PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { getToken } from 'app/bungie-api/oauth-tokens';
import { AppIcon, banIcon } from './icons';
import { fetchWishList } from 'app/wishlists/wishlist-fetch';
import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { accountsSelector } from 'app/accounts/reducer';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { AccountContext } from './context';
import { Switch, Route, useRouteMatch } from 'react-router';
import Inventory from 'app/inventory/Inventory';
import Progress from 'app/progress/Progress';
import LoadoutBuilder from 'app/loadout-builder/LoadoutBuilder';
import D1LoadoutBuilder from 'app/destiny1/loadout-builder/D1LoadoutBuilder';
import Vendors from 'app/vendors/Vendors';
import D1Vendors from 'app/destiny1/vendors/D1Vendors';
import RecordBooks from 'app/destiny1/record-books/RecordBooks';
import Organizer from 'app/organizer/Organizer';
import SingleVendor from 'app/vendors/SingleVendor';
import Activities from 'app/destiny1/activities/Activities';
import Collections from 'app/collections/Collections';
import DefaultAccount from './DefaultAccount';

interface ProvidedProps {
  destinyVersion: DestinyVersion;
  platformMembershipId: string;
}

interface StoreProps {
  account?: DestinyAccount;
  profileError?: DimError;
  d2Manifest?: D2ManifestDefinitions;
  d1Manifest?: D1ManifestDefinitions;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return {
    account: accountsSelector(state).find(
      (account) =>
        account.membershipId === props.platformMembershipId &&
        account.destinyVersion === props.destinyVersion
    ),
    profileError: state.inventory.profileError,
    d2Manifest: state.manifest.d2Manifest,
    d1Manifest: state.manifest.d1Manifest
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

/**
 * Base view for pages that show Destiny content.
 */
function Destiny({ account, d1Manifest, d2Manifest, dispatch, profileError }: Props) {
  useEffect(() => {
    const { account, dispatch } = this.props;
    if (!account) {
      return;
    }
    if ($featureFlags.wishLists && account.destinyVersion === 2) {
      dispatch(fetchWishList());
    }
    if ($featureFlags.vendorEngrams && account.destinyVersion === 2) {
      dispatch(loadVendorDropsFromIndexedDB());
    }
  }, [dispatch]);

  const { path } = useRouteMatch();

  if (!account) {
    return (
      <div className="dim-page">
        <ErrorPanel
          title={t('Accounts.MissingTitle')}
          fallbackMessage={t('Accounts.MissingDescription')}
          showTwitters={true}
        />
      </div>
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

  // Define some hotkeys without implementation, so they show up in the help
  const hotkeys: Hotkey[] = [
    {
      combo: 't',
      description: t('Hotkey.ToggleDetails'),
      callback() {
        // Empty - this gets redefined in dimMoveItemProperties
      }
    }
  ];

  itemTagList.forEach((tag) => {
    if (tag.hotkey) {
      hotkeys.push({
        combo: tag.hotkey,
        description: t('Hotkey.MarkItemAs', {
          tag: t(tag.label)
        }),
        callback() {
          // Empty - this gets redefined in item-tag.component.ts
        }
      });
    }
  });

  console.log('Render Destiny');
  const contents = (
    <>
      <div id="content">
        <Switch>
          <Route path={`${path}/inventory`} exact>
            <Inventory />
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
              <LoadoutBuilder account={account} />
            ) : (
              <D1LoadoutBuilder />
            )}
          </Route>
          {account.destinyVersion === 2 && (
            <Route path={`${path}/organizer`}>
              <Organizer />
            </Route>
          )}
          {account.destinyVersion === 2 && (
            <Route path={`${path}/vendors/:vendorId`} exact>
              <SingleVendor account={account} />
            </Route>
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
            {/* TODO: Should we have a 404 page?? or just redirect to inventory */}
            <DefaultAccount />
          </Route>
        </Switch>
      </div>
      <GlobalHotkeys hotkeys={hotkeys} />
      <ItemPopupContainer boundarySelector=".store-header" />
      <ItemPickerContainer />
      <MoveAmountPopupContainer />
      <ManifestProgress destinyVersion={account.destinyVersion} />
    </>
  );
  return account.destinyVersion === 2 ? (
    d2Manifest ? (
      <AccountContext.Provider
        value={{
          account,
          manifest: d2Manifest
        }}
      >
        {contents}
      </AccountContext.Provider>
    ) : (
      contents
    )
  ) : d1Manifest ? (
    <AccountContext.Provider
      value={{
        account,
        manifest: d1Manifest
      }}
    >
      {contents}
    </AccountContext.Provider>
  ) : (
    contents
  );
}

export default connect<StoreProps>(mapStateToProps)(Destiny);
