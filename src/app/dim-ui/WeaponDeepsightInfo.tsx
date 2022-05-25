import { t } from 'app/i18next-t';
import { DimDeepsight } from 'app/inventory/item-types';
import { percent } from 'app/shell/formatters';
import clsx from 'clsx';
import React from 'react';
import styles from './WeaponDeepsightInfo.m.scss';

/**
 * A progress bar that shows a weapon's Deepsight Resonance attunement progress.
 */
export function WeaponDeepsightInfo({ deepsightInfo }: { deepsightInfo: DimDeepsight }) {
  const pct = percent(deepsightInfo.progress || 0);

  return (
    <div className={styles.deepsightProgress}>
      <div
        className={clsx('objective-row', {
          ['objective-complete']: deepsightInfo.complete,
        })}
      >
        <div className="objective-checkbox" />
        <div className={clsx('objective-progress', styles.deepsightObjectiveProgress)}>
          <div className="objective-progress-bar" style={{ width: pct }} />
          <div className="objective-description">{t('MovePopup.AttunementProgress')}</div>
          <div className="objective-text">{pct}</div>
        </div>
      </div>
    </div>
  );
}
