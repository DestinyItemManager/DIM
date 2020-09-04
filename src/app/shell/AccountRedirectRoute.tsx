import React, { useEffect } from 'react';
import { t } from 'app/i18next-t';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'app/store/types';
import ErrorPanel from './ErrorPanel';
import { accountsLoadedSelector, currentAccountSelector } from 'app/accounts/selectors';
import { Redirect, useRouteMatch } from 'react-router';
import { getPlatforms } from 'app/accounts/platforms';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';

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

  const { path } = useRouteMatch();

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

  return <Redirect to={`/${account.membershipId}/d${account.destinyVersion}${path}`} />;
}
