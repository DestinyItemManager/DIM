import { t } from 'app/i18next-t';
import { DimDeepsight } from 'app/inventory/item-types';
import { percent } from 'app/shell/filters';
import clsx from 'clsx';
import React from 'react';
import BungieImage from './BungieImage';

/**
 * A progress bar that shows a weapon's Deepsight Resonance attunement progress and lists the extractable
 * Resonant Elements.
 */
export function WeaponDeepsightInfo({
  deepsightInfo,
  className,
}: {
  deepsightInfo: DimDeepsight;
  className: string;
}) {
  const pct = percent(deepsightInfo.progress || 0);

  return (
    <div className={className}>
      <div
        className={clsx('objective-row', {
          ['objective-complete']: deepsightInfo.complete,
        })}
      >
        <div className="objective-checkbox" />
        <div className="objective-progress">
          <div className="objective-progress-bar" style={{ width: pct }} />
          <div className="objective-description">{t('MovePopup.AttunementProgress')}</div>
          <div className="objective-text">{pct}</div>
        </div>
      </div>
      {deepsightInfo.resonantElements.map((e) => (
        <div key={e.tag} className="element">
          <BungieImage src={e.icon} />
          <span>{e.name}</span>
        </div>
      ))}
    </div>
  );
}
