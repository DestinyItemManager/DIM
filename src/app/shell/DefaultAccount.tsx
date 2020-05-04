import React, { useEffect } from 'react';
import { t } from 'app/i18next-t';
import { connect } from 'react-redux';
import { ThunkDispatchProp, RootState } from 'app/store/reducers';
import { DimError } from 'app/bungie-api/bungie-service-helper';
import ErrorPanel from './ErrorPanel';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { currentAccountSelector, accountsLoadedSelector } from 'app/accounts/reducer';
import { getPlatforms } from 'app/accounts/platforms';
import { Loading } from 'app/dim-ui/Loading';
import { accountRoute } from 'app/routes';
import { Redirect } from 'react-router';

interface StoreProps {
  activeAccount?: DestinyAccount;
  accountsLoaded: boolean;
  accountsError?: DimError;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    activeAccount: currentAccountSelector(state),
    accountsLoaded: accountsLoadedSelector(state),
    accountsError: state.accounts.accountsError
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
        <Loading />
      )}
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(DefaultAccount);
