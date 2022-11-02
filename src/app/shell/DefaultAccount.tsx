import { getPlatforms } from 'app/accounts/platforms';
import SelectAccount from 'app/accounts/SelectAccount';
import {
  accountsLoadedSelector,
  accountsSelector,
  currentAccountMembershipIdSelector,
  destinyVersionSelector,
} from 'app/accounts/selectors';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { accountRoute } from 'app/routes';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';
import ErrorPanel from './ErrorPanel';

/**
 * DefaultAccount handles when there is no URL path selecting a specific
 * account. It attempts to redirect to the last used account, or otherwise shows
 * either a menu of accounts or an error.
 */
export default function DefaultAccount() {
  const dispatch = useThunkDispatch();
  const accounts = useSelector(accountsSelector);
  const accountsLoaded = useSelector(accountsLoadedSelector);
  const accountsError = useSelector((state: RootState) => state.accounts.accountsError);

  const currentAccountMembershipId = useSelector(currentAccountMembershipIdSelector);
  const destinyVersion = useSelector(destinyVersionSelector);

  useEffect(() => {
    // If currentAccountMembershipId is set we'll redirect immediately, we don't need to load accounts
    if (!accountsLoaded && !currentAccountMembershipId) {
      dispatch(getPlatforms());
    }
  }, [dispatch, accountsLoaded, currentAccountMembershipId]);

  // Show a loading screen while we're still loading accounts.
  // If currentAccountMembershipId is set we'll redirect immediately, we don't need to load accounts
  if (!accountsLoaded && !currentAccountMembershipId) {
    return <ShowPageLoading message={t('Loading.Accounts')} />;
  }

  // If we have a selected account ID, redirect to that regardless of whether it
  // actually exists. This help us show the correct error message on the Destiny
  // page and avoid bouncing to another account when Bungie.net isn't returning
  // all the accounts.
  if (currentAccountMembershipId) {
    return (
      <Navigate to={accountRoute({ membershipId: currentAccountMembershipId, destinyVersion })} />
    );
  }

  // If we don't have a saved account ID, just present the list of accounts for them
  // to choose from, instead of selecting one based on play time or something.
  if (accounts.length > 0) {
    return (
      <div className="dim-page">
        <SelectAccount />
      </div>
    );
  }

  // Finally, just show an error about there being no characters. We don't have anything else
  // to go on,
  return (
    <div className="dim-page">
      <ErrorPanel
        error={accountsError}
        fallbackMessage={t('Accounts.NoCharacters')}
        title={t('Accounts.ErrorLoading')}
        showTwitters={true}
        showReload={true}
      />
    </div>
  );
}
