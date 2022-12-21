import { destinyVersionSelector } from 'app/accounts/selectors';
import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { isDragging$ } from 'app/inventory/drag-events';
import {
  autoRefreshEnabledSelector,
  profileErrorSelector,
  profileMintedSelector,
} from 'app/inventory/selectors';
import { useEventBusListener } from 'app/utils/hooks';
import { i15dDurationFromMsWithSeconds } from 'app/utils/time';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSubscription } from 'use-subscription';
import ErrorPanel from './ErrorPanel';
import { AppIcon, faClock, faExclamationTriangle, refreshIcon } from './icons';
import { loadingTracker } from './loading-tracker';
import { refresh } from './refresh-events';
import styles from './RefreshButton.m.scss';

/** We consider the profile stale if it's out of date with respect to the game data by this much */
const STALE_PROFILE_THRESHOLD = 90_000;

export default function RefreshButton({ className }: { className?: string }) {
  const [disabled, setDisabled] = useState(false);
  const autoRefresh = useSelector(autoRefreshEnabledSelector);

  const handleChanges = useCallback(
    () => setDisabled(!navigator.onLine || document.hidden || isDragging$.getCurrentValue()),
    []
  );
  const active = useSubscription(loadingTracker.active$);
  useEventBusListener(isDragging$, handleChanges);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleChanges);
    document.addEventListener('online', handleChanges);

    return () => {
      document.removeEventListener('visibilitychange', handleChanges);
      document.removeEventListener('online', handleChanges);
    };
  }, [handleChanges]);

  useHotkey('r', t('Hotkey.RefreshInventory'), refresh);

  const profileAge = useProfileAge();
  const outOfDate = profileAge !== undefined && profileAge > STALE_PROFILE_THRESHOLD;
  const profileError = useSelector(profileErrorSelector);

  return (
    <PressTip
      tooltip={
        <RefreshButtonTooltip
          autoRefresh={autoRefresh}
          profileAge={profileAge}
          profileError={profileError}
        />
      }
    >
      <button
        type="button"
        className={clsx(styles.refreshButton, className, { disabled })}
        onClick={refresh}
        title={t('Header.Refresh') + (autoRefresh ? '\n' + t('Header.AutoRefresh') : '')}
        aria-keyshortcuts="R"
      >
        <AppIcon icon={refreshIcon} spinning={active} />
        {autoRefresh && <div className={styles.userIsPlaying} />}
        {(profileError || (outOfDate && !active)) && (
          <div className={styles.outOfDate}>
            <AppIcon icon={profileError ? faExclamationTriangle : faClock} />
          </div>
        )}
      </button>
    </PressTip>
  );
}

function useProfileAge() {
  const profileMintedDate = useSelector(profileMintedSelector);
  const [_tickState, setTickState] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTickState((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return profileMintedDate.getTime() === 0 ? undefined : Date.now() - profileMintedDate.getTime();
}

function RefreshButtonTooltip({
  autoRefresh,
  profileAge,
  profileError,
}: {
  autoRefresh: boolean;
  profileAge: number | undefined;
  profileError: Error | undefined;
}) {
  const isManifestError = profileError?.name === 'ManifestError';
  const destinyVersion = useSelector(destinyVersionSelector);

  return (
    <>
      {profileError ? (
        <div className={styles.errorDetails}>
          <Tooltip.Customize className={styles.errorTooltip} />
          <ErrorPanel
            title={
              isManifestError
                ? t('Accounts.ErrorLoadManifest')
                : t('Accounts.ErrorLoadInventory', { version: destinyVersion })
            }
            error={profileError}
            frameless
          />
        </div>
      ) : (
        <>
          <b>{t('Header.Refresh') + (autoRefresh ? '\n' + t('Header.AutoRefresh') : '')}</b>
          {profileAge !== undefined && (
            <div>{t('Header.ProfileAge', { age: i15dDurationFromMsWithSeconds(profileAge) })}</div>
          )}
        </>
      )}
    </>
  );
}
