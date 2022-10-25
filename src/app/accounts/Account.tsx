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
  className,
}: {
  account: DestinyAccount;
  selected?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(styles.account, className, { [styles.selectedAccount]: selected })}
      role="menuitem"
    >
      Destiny {account.destinyVersion}
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
