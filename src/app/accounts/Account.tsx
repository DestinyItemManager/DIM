import { compareBy } from 'app/utils/comparators';
import { BungieMembershipType } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { AppIcon } from '../shell/icons';
import styles from './Account.m.scss';
import { DestinyAccount, PLATFORM_ICONS, PLATFORM_LABELS } from './destiny-account';

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
      {account.platforms
        .filter((p) => account.platforms.length === 1 || p !== BungieMembershipType.TigerStadia)
        .sort(compareBy((p) => account.originalPlatformType !== p))
        .map((platformType, index) =>
          platformType in PLATFORM_ICONS ? (
            <AppIcon
              key={platformType}
              className={clsx({ [styles.first]: index === 0 })}
              icon={PLATFORM_ICONS[platformType]!}
            />
          ) : (
            PLATFORM_LABELS[platformType]
          ),
        )}
    </div>
  );
}
