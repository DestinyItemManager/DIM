import clsx from 'clsx';
import { AppIcon } from '../shell/icons';
import styles from './Account.m.scss';
import { DestinyAccount, PLATFORM_ICONS } from './destiny-account';

/**
 * Accounts that appear in the hamburger menu.
 */
export default function Account({
  account,
  selected,
}: {
  account: DestinyAccount;
  selected?: boolean;
}) {
  return (
    <div className={clsx(styles.account, { [styles.selectedAccount]: selected })} role="menuitem">
      <b>Destiny {account.destinyVersion}</b>
      {account.platforms.map((platformType, index) => (
        <AppIcon
          key={platformType}
          className={clsx({ [styles.first]: index === 0 })}
          icon={PLATFORM_ICONS[platformType]}
        />
      ))}
    </div>
  );
}
