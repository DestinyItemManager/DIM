import { t } from 'app/i18next-t';
import { accountRoute } from 'app/routes';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppIcon, signOutIcon } from '../shell/icons';
import Account from './Account';
import styles from './MenuAccounts.m.scss';
import { logOut } from './platforms';
import { accountsSelector, currentAccountSelector } from './selectors';

export default function MenuAccounts({
  closeDropdown,
}: {
  closeDropdown(e: React.MouseEvent<HTMLDivElement>): void;
}) {
  const dispatch = useThunkDispatch();
  const currentAccount = useSelector(currentAccountSelector);
  const accounts = useSelector(accountsSelector);
  if (!currentAccount) {
    return null;
  }

  const onLogOut = () => dispatch(logOut());

  const sortedAccounts = _.sortBy(accounts, (a) => -(a.lastPlayed?.getTime() || 0));

  return (
    <div className={styles.accountSelect}>
      <h3>Accounts</h3>
      {sortedAccounts.map((account) => (
        <Link
          key={`${account.membershipId}-${account.destinyVersion}`}
          to={`${accountRoute(account)}/inventory`}
        >
          <Account
            account={account}
            selected={account === currentAccount}
            onClick={closeDropdown}
          />
        </Link>
      ))}
      <div className={clsx(styles.logout)} onClick={onLogOut}>
        <AppIcon icon={signOutIcon} />
        &nbsp;
        {t('Settings.LogOut')}
      </div>
    </div>
  );
}
