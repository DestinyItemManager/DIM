import { DestinyAccount } from 'app/accounts/destiny-account';
import { createLoadoutShare } from 'app/dim-api/dim-api';
import Sheet from 'app/dim-ui/Sheet';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import { convertDimLoadoutToApiLoadout } from 'app/loadout/loadout-type-converters';
import { Loadout } from 'app/loadout/loadout-types';
import { showNotification } from 'app/notifications/notifications';
import ErrorPanel from 'app/shell/ErrorPanel';
import { copyIcon, shareIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { count } from 'app/utils/collections';
import { convertToError } from 'app/utils/errors';
import React, { useEffect, useState } from 'react';
import * as styles from './LoadoutShareSheet.m.scss';

// Cache shares to loadouts weakly, to cut down on creating shares
const loadoutShares = new WeakMap<Loadout, string>();

export default function LoadoutShareSheet({
  account,
  loadout,
  onClose,
}: {
  account: DestinyAccount;
  loadout: Loadout;
  onClose: () => void;
}) {
  const [shareUrl, setShareUrl] = useState<string | undefined>(loadoutShares.get(loadout));
  const [shareError, setShareError] = useState<Error>();

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const shareUrl =
          loadoutShares.get(loadout) ??
          (await createLoadoutShare(account.membershipId, convertDimLoadoutToApiLoadout(loadout)));
        loadoutShares.set(loadout, shareUrl);
        if (!canceled) {
          setShareUrl(shareUrl);
        }
      } catch (e) {
        if (!canceled) {
          setShareError(convertToError(e));
        }
      }
    })();
    return () => {
      canceled = true;
    };
  }, [account.membershipId, loadout]);

  const handleCopy = () => {
    if (!shareUrl) {
      return;
    }
    navigator.clipboard.writeText(shareUrl);
    showNotification({
      type: 'success',
      title: t('Loadouts.Share.Copied'),
    });
  };

  const handleShare = async (closeSheet: () => void) => {
    if (!shareUrl || !('share' in navigator)) {
      return;
    }
    await navigator.share({ url: shareUrl });
    closeSheet();
  };

  const handleFocusUrl = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  const canShare = 'canShare' in navigator && navigator.canShare({ url: shareUrl });

  const numMods = loadout.parameters?.mods?.length ?? 0;
  const numItems = count(loadout.items, (i) => !i.socketOverrides);
  const hasFashion = Boolean(loadout.parameters?.modsByBucket);
  const hasSubclass = loadout.items.some((i) => i.equip && i.socketOverrides);
  const hasLoParams = Boolean(
    loadout.parameters &&
    (loadout.parameters.query ||
      loadout.parameters.exoticArmorHash ||
      loadout.parameters.statConstraints?.length),
  );

  return (
    <Sheet
      onClose={onClose}
      header={
        <>
          <h1>{t('Loadouts.Share.Title', { name: loadout.name })}</h1>
          <UserGuideLink topic="Share-Loadouts" />
        </>
      }
      sheetClassName={styles.sheet}
    >
      {({ onClose }) => (
        <div className={styles.body}>
          {shareError ? (
            <ErrorPanel title={t('Loadouts.Share.Error')} error={shareError} />
          ) : (
            <div>
              <div>
                {t('Loadouts.Share.Summary')}
                <ul>
                  {numItems > 0 && <li>{t('Loadouts.Share.NumItems', { count: numItems })}</li>}
                  {numMods > 0 && <li>{t('Loadouts.Share.NumMods', { count: numItems })}</li>}
                  {hasFashion && <li>{t('Loadouts.Share.Fashion')}</li>}
                  {hasSubclass && <li>{t('Loadouts.Share.Subclass')}</li>}
                  {hasLoParams && <li>{t('Loadouts.Share.LoadoutOptimizer')}</li>}
                  {loadout.notes && <li>{t('Loadouts.Share.Notes')}</li>}
                </ul>
              </div>
              <div className={styles.fields}>
                <input
                  onFocus={handleFocusUrl}
                  value={shareUrl ?? ''}
                  placeholder={t('Loadouts.Share.Placeholder')}
                  readOnly
                />
                {canShare ? (
                  <button
                    type="button"
                    className="dim-button"
                    onClick={() => handleShare(onClose)}
                    disabled={!shareUrl}
                  >
                    <AppIcon icon={shareIcon} /> {t('Loadouts.Share.NativeShare')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="dim-button"
                    onClick={handleCopy}
                    disabled={!shareUrl}
                  >
                    <AppIcon icon={copyIcon} /> {t('Loadouts.Share.CopyButton')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
