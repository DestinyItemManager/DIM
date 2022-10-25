import { t } from 'app/i18next-t';
import { accountRoute } from 'app/routes';
import { AppIcon, signOutIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { DestinyAccount, PLATFORM_ICONS } from './destiny-account';
import { logOut } from './platforms';
import styles from './SelectAccount.m.scss';
import { accountsSelector } from './selectors';

/**
 * The large "select accounts" page shown when the user has not yet selected an account.
 */
export default function SelectAccount() {
  const accounts = useSelector(accountsSelector);
  const sortedAccounts = _.sortBy(
    accounts,
    (a) => -a.destinyVersion,
    (a) => -a.lastPlayed.getTime()
  );

  console.log(accounts, sortedAccounts);
  const bungieName = sortedAccounts[0].displayName;

  const dispatch = useThunkDispatch();
  const onLogOut = () => dispatch(logOut());

  return (
    <div className={styles.accountSelect}>
      <h1>{t('Accounts.Choose', { bungieName })}</h1>
      <div className={styles.accountList}>
        {sortedAccounts.map((account) => (
          <Account key={`${account.membershipId}-${account.destinyVersion}`} account={account} />
        ))}
      </div>
      <p>
        {t('Accounts.MissingAccountWarning')} {t('Accounts.SwitchAccounts')}
      </p>
      <div onClick={onLogOut} role="button">
        <AppIcon icon={signOutIcon} />
        &nbsp;
        {t('Settings.LogOut')}
      </div>
    </div>
  );
}

function Account({ account }: { account: DestinyAccount }) {
  return (
    <Link className={styles.account} to={`${accountRoute(account)}/inventory`}>
      <div className={styles.accountDetails}>
        Destiny {account.destinyVersion}
        {account.platforms.map((platformType, index) => (
          <AppIcon
            key={platformType}
            className={clsx({ [styles.first]: index === 0 })}
            icon={PLATFORM_ICONS[platformType]}
          />
        ))}
      </div>
    </Link>
  );
}
