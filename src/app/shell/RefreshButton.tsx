import { destinyVersionSelector } from 'app/accounts/selectors';
import { PressTip, useTooltipCustomization } from 'app/dim-ui/PressTip';
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
import * as styles from './RefreshButton.m.scss';
import { AppIcon, faClock, faExclamationTriangle, refreshIcon } from './icons';
import { loadingTracker } from './loading-tracker';
import { refresh } from './refresh-events';

/** We consider the profile stale if it's out of date with respect to the game data by this much */
const STALE_PROFILE_THRESHOLD = 90_000;
const MIN_SPIN = 1000; // 1 second

export default function RefreshButton({ className }: { className?: string }) {
  const [disabled, setDisabled] = useState(false);
  const autoRefresh = useSelector(autoRefreshEnabledSelector);

  const handleChanges = useCallback(
    () => setDisabled(!navigator.onLine || document.hidden || isDragging$.getCurrentValue()),
    [],
  );
  const active = useSubscription(loadingTracker.active$);

  // Always show the spinner for at least MIN_SPIN milliseconds
  const [spin, setSpin] = useState(active ? Date.now() : 0);
  useEffect(() => {
    if (active && spin === 0) {
      setSpin(Date.now());
    } else if (!active && spin !== 0) {
      const elapsed = Date.now() - spin;
      const remainingTime = Math.max(0, MIN_SPIN - elapsed);
      if (remainingTime > 0) {
        const timer = window.setTimeout(() => {
          setSpin(0);
        }, remainingTime);
        return () => window.clearTimeout(timer);
      } else {
        setSpin(0);
      }
    }
  }, [active, spin]);

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

  const outOfDate = useProfileOutOfDate();
  const profileError = useSelector(profileErrorSelector);
  const showOutOfDateWarning = outOfDate && !active && !autoRefresh;

  return (
    <PressTip tooltip={<RefreshButtonTooltip autoRefresh={autoRefresh} />}>
      <button
        type="button"
        className={clsx(styles.refreshButton, className, { disabled })}
        onClick={refresh}
        title={t('Header.Refresh') + (autoRefresh ? `\n${t('Header.AutoRefresh')}` : '')}
        aria-keyshortcuts="R"
      >
        <AppIcon icon={refreshIcon} spinning={spin !== 0} />
        {autoRefresh && <div className={styles.userIsPlaying} />}
        {(profileError || showOutOfDateWarning) && (
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

  return profileAge(profileMintedDate);
}

function profileAge(profileMintedDate: Date) {
  return profileMintedDate.getTime() === 0 ? undefined : Date.now() - profileMintedDate.getTime();
}

function profileOutOfDate(profileMintedDate: Date) {
  const profileAgeMs = profileAge(profileMintedDate);
  return profileAgeMs !== undefined && profileAgeMs > STALE_PROFILE_THRESHOLD;
}

/** Like useProfileAge but only sets a boolean to avoid lots of re-renders. */
function useProfileOutOfDate() {
  const profileMintedDate = useSelector(profileMintedSelector);
  const [outOfDate, setOutOfDate] = useState(() => profileOutOfDate(profileMintedDate));
  useEffect(() => {
    setOutOfDate(profileOutOfDate(profileMintedDate));
    const interval = setInterval(() => {
      setOutOfDate(profileOutOfDate(profileMintedDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [profileMintedDate]);

  return outOfDate;
}

function RefreshButtonTooltip({ autoRefresh }: { autoRefresh: boolean }) {
  const profileAge = useProfileAge();
  const profileError = useSelector(profileErrorSelector);
  const isManifestError = profileError?.name === 'ManifestError';
  const destinyVersion = useSelector(destinyVersionSelector);

  useTooltipCustomization({
    className: profileError ? styles.errorTooltip : null,
  });

  return (
    <>
      {profileError ? (
        <div className={styles.errorDetails}>
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
          <b>{t('Header.Refresh') + (autoRefresh ? `\n${t('Header.AutoRefresh')}` : '')}</b>
          {profileAge !== undefined && (
            <div>{t('Header.ProfileAge', { age: i15dDurationFromMsWithSeconds(profileAge) })}</div>
          )}
        </>
      )}
    </>
  );
}
