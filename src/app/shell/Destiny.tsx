import React from 'react';
import { UIView } from '@uirouter/react';
import ManifestProgress from './ManifestProgress';
import { DestinyAccount } from '../accounts/destiny-account';
import ItemPopupContainer from '../item-popup/ItemPopupContainer';
import ItemPickerContainer from '../item-picker/ItemPickerContainer';
import MoveAmountPopupContainer from '../inventory/MoveAmountPopupContainer';
import { t } from 'app/i18next-t';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import { itemTagList } from '../inventory/dim-item-info';
import { Hotkey } from '../hotkeys/hotkeys';
import { connect } from 'react-redux';
import { loadWishListAndInfoFromIndexedDB } from 'app/wishlists/reducer';
import { loadVendorDropsFromIndexedDB } from 'app/vendorEngramsXyzApi/reducer';
import { ThunkDispatchProp, RootState } from 'app/store/reducers';
import { DimError } from 'app/bungie-api/bungie-service-helper';
import ErrorPanel from './ErrorPanel';
import { PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { getToken } from 'app/bungie-api/oauth-tokens';
import { AppIcon, banIcon } from './icons';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  profileError?: DimError;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    profileError: state.inventory.profileError
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

/**
 * Base view for pages that show Destiny content.
 */
class Destiny extends React.Component<Props> {
  componentDidMount() {
    const { account, dispatch } = this.props;
    if (!account) {
      return;
    }
    if ($featureFlags.wishLists) {
      dispatch(loadWishListAndInfoFromIndexedDB());
    }
    if ($featureFlags.vendorEngrams) {
      dispatch(loadVendorDropsFromIndexedDB());
    }
  }

  render() {
    const { account, profileError } = this.props;

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
      const token = getToken()!;
      return (
        <div className="dim-page">
          <ErrorPanel
            title={t('Accounts.ErrorLoadInventory')}
            error={profileError}
            showTwitters={true}
          >
            {account.destinyVersion === 1 &&
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

    return (
      <>
        <div id="content">
          <UIView />
        </div>
        <GlobalHotkeys hotkeys={hotkeys} />
        <ItemPopupContainer boundarySelector=".store-header" />
        <ItemPickerContainer />
        <MoveAmountPopupContainer />
        <ManifestProgress destinyVersion={account.destinyVersion} />
      </>
    );
  }
}

export default connect<StoreProps>(mapStateToProps)(Destiny);
