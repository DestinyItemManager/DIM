import { t } from 'app/i18next-t';
import { accountRoute } from 'app/routes';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router';
import { AppIcon, signOutIcon } from '../shell/icons';
import Account from './Account';
import * as styles from './MenuAccounts.m.scss';
import { logOut } from './platforms';
import { accountsSelector, currentAccountSelector } from './selectors';

/**
 * The accounts list in the sidebar menu.
 */
export default function MenuAccounts({
  closeDropdown,
}: {
  closeDropdown: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  const dispatch = useThunkDispatch();
  const currentAccount = useSelector(currentAccountSelector);
  const accounts = useSelector(accountsSelector);
  const navigate = useNavigate();

  const onLogOut = async () => {
    await dispatch(logOut());
    await navigate('/login');
  };

  const sortedAccounts = accounts.toSorted(
    chainComparator(
      reverseComparator(compareBy((a) => a.destinyVersion)), // 2 before 1
      reverseComparator(compareBy((a) => a.lastPlayed.getTime())),
    ),
  );
  const bungieName = sortedAccounts[0]?.displayName;

  return (
    <div className={styles.accountSelect}>
      <h3>
        {t('Accounts.Title')} <span className={styles.accountName}>{bungieName}</span>
      </h3>
      {sortedAccounts.map((account) => (
        <Link
          key={`${account.membershipId}-${account.destinyVersion}`}
          to={`${accountRoute(account)}/inventory`}
          onClick={closeDropdown}
        >
          <Account account={account} selected={account === currentAccount} />
        </Link>
      ))}
      <button type="button" className={styles.logout} onClick={onLogOut}>
        <AppIcon icon={signOutIcon} />
        &nbsp;
        {t('Settings.LogOut')}
      </button>
    </div>
  );
}
