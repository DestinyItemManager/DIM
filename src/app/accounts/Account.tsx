import { AppIcon } from 'app/shell/icons';
import clsx from 'clsx';
import React from 'react';
import styles from './Account.m.scss';
import { DestinyAccount, PLATFORM_ICONS } from './destiny-account';

function Account(
  {
    account,
    selected,
    className,
    ...other
  }: {
    account: DestinyAccount;
    selected?: boolean;
    className?: string;
  } & React.HTMLAttributes<HTMLDivElement>,
  ref?: React.Ref<HTMLDivElement>
) {
  return (
    <div
      ref={ref}
      className={clsx(styles.account, className, { [styles.selectedAccount]: selected })}
      {...other}
      role="menuitem"
    >
      <div className={styles.accountName}>{account.displayName}</div>
      <div className={styles.accountDetails}>
        <b>{account.destinyVersion === 1 ? 'D1' : 'D2'}</b>
        {account.platforms.map((platformType, index) => (
          <AppIcon
            key={platformType}
            className={clsx({ [styles.first]: index === 0 })}
            icon={PLATFORM_ICONS[platformType]}
          />
        ))}
      </div>
    </div>
  );
}

export default React.forwardRef(Account);
