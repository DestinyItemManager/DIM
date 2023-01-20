import { t } from 'app/i18next-t';
import { accountRoute } from 'app/routes';
import { AppIcon, signOutIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Account from './Account';
import { logOut } from './platforms';
import styles from './SelectAccount.m.scss';
import { accountsSelector } from './selectors';

/**
 * The large "select accounts" page shown when the user has not yet selected an account.
 */
export default function SelectAccount({ path }: { path?: string }) {
  const accounts = useSelector(accountsSelector);
  const sortedAccounts = _.sortBy(
    accounts,
    (a) => -a.destinyVersion,
    (a) => -a.lastPlayed.getTime()
  );

  const bungieName = sortedAccounts[0].displayName;

  const dispatch = useThunkDispatch();
  const onLogOut = () => dispatch(logOut());

  return (
    <div className={styles.accountSelect}>
      <h1>{t('Accounts.Choose', { bungieName })}</h1>
      <div className={styles.accountList}>
        {sortedAccounts.map((account) => (
          <Link
            key={`${account.membershipId}-${account.destinyVersion}`}
            className={styles.account}
            to={accountRoute(account) + (path ?? '')}
          >
            <Account className={styles.accountDetails} account={account} />
          </Link>
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
