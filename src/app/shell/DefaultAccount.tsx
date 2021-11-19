import { getPlatforms } from 'app/accounts/platforms';
import { accountsLoadedSelector, currentAccountSelector } from 'app/accounts/selectors';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { accountRoute } from 'app/routes';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';
import ErrorPanel from './ErrorPanel';

/**
 * A view for when there's been an error loading accounts or there are no accounts.
 */
export default function DefaultAccount() {
  const dispatch = useThunkDispatch();
  const activeAccount = useSelector(currentAccountSelector);
  const accountsLoaded = useSelector(accountsLoadedSelector);
  const accountsError = useSelector((state: RootState) => state.accounts.accountsError);

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
          <Navigate to={accountRoute(activeAccount)} />
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
