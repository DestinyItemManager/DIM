import { getPlatforms } from 'app/accounts/platforms';
import { accountsLoadedSelector, currentAccountSelector } from 'app/accounts/selectors';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { RootState } from 'app/store/types';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router';
import ErrorPanel from './ErrorPanel';

/**
 * When rendered at a particular path, this component will wait for the last-used account to be loaded
 * (showing a loading indicator if necessary) and when it is loaded, will redirect to the account-specific
 * form of the current path.
 *
 * e.g. /organizer => /2131244124151/d2/organizer
 */
export default function AccountRedirectRoute() {
  const account = useSelector(currentAccountSelector);
  const accountsLoaded = useSelector(accountsLoadedSelector);
  const profileError = useSelector((state: RootState) => state.inventory.profileError);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!accountsLoaded) {
      dispatch(getPlatforms());
    }
  }, [dispatch, accountsLoaded]);

  const { search, pathname } = useLocation();

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
    <Navigate to={`/${account.membershipId}/d${account.destinyVersion}${pathname}${search}`} />
  );
}
