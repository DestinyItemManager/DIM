import clsx from 'clsx';
import React from 'react';
import { AppIcon, collapseIcon } from '../shell/icons';
import './Account.scss';
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
      className={clsx('account', className, { 'selected-account': selected })}
      {...other}
      role="menuitem"
    >
      <div className="account-name">{account.displayName}</div>
      <div className="account-details">
        <b>{account.destinyVersion === 1 ? 'D1' : 'D2'}</b>
        {account.platforms.map((platformType, index) => (
          <AppIcon
            key={platformType}
            className={index === 0 ? 'first' : ''}
            icon={PLATFORM_ICONS[platformType]}
          />
        ))}
      </div>
      {selected && <AppIcon className="collapse" icon={collapseIcon} />}
    </div>
  );
}

export default React.forwardRef(Account);
