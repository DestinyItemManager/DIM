import { DestinyAccount } from 'app/accounts/destiny-account';
import { getPlatforms } from 'app/accounts/platforms';
import { accountsLoadedSelector, currentAccountSelector } from 'app/accounts/selectors';
import { DimError } from 'app/bungie-api/bungie-service-helper';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { accountRoute } from 'app/routes';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import ErrorPanel from './ErrorPanel';

interface StoreProps {
  activeAccount?: DestinyAccount;
  accountsLoaded: boolean;
  accountsError?: DimError;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    activeAccount: currentAccountSelector(state),
    accountsLoaded: accountsLoadedSelector(state),
    accountsError: state.accounts.accountsError,
  };
}

type Props = StoreProps & ThunkDispatchProp;

/**
 * A view for when there's been an error loading accounts or there are no accounts.
 */
function DefaultAccount({ accountsLoaded, activeAccount, accountsError, dispatch }: Props) {
  useEffect(() => {
    if (!accountsLoaded) {
      dispatch(getPlatforms());
    }
  }, [dispatch, accountsLoaded]);

  // Use platforms from redux
  return (
    <div className="dim-page">
      {accountsLoaded ? (
        activeAccount ? (
          <Redirect to={accountRoute(activeAccount)} />
        ) : (
          <ErrorPanel
            error={accountsError}
            fallbackMessage={t('Accounts.NoCharacters')}
            title={t('Accounts.ErrorLoading')}
            showTwitters={true}
            showReload={true}
          />
        )
      ) : (
        <ShowPageLoading message={t('Loading.Accounts')} />
      )}
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(DefaultAccount);
