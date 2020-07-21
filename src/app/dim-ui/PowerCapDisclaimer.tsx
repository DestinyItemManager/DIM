import React from 'react';
import { AppIcon, faExclamationTriangle } from '../shell/icons';
import PressTip from 'app/dim-ui/PressTip';
import { DimItem } from 'app/inventory/item-types';
import './PowerCapDisclaimer.scss';
import { t } from 'app/i18next-t';
import missingSources from 'data/d2/missing-source-info';
import D2Sources from 'data/d2/source-info';

// temporarily, we are adding warnings to these sourceHashes
// because they display an incorrect Power Limit
export const powerCapDisclaimer = [
  2455011338, // last wish
  1491707941, // gos
];

export function PowerCapDisclaimer({ item }: { item: DimItem }) {
  if (
    // rule out easy stuff first, to try and avoid doing hash lookups
    item.isDestiny2() &&
    item.powerCap === 1060 &&
    // if this is any raid armor
    ((item.bucket.inArmor &&
      (D2Sources.raid.sourceHashes.includes(item.source) ||
        missingSources.raid.includes(item.hash))) ||
      // or last wish and garden weapons
      (item.bucket.inWeapons &&
        (powerCapDisclaimer.includes(item.source) || missingSources.lastwish.includes(item.hash))))
  ) {
    return (
      <PressTip elementType="span" tooltip={t('Stats.PowerCapDisclaimer')}>
        <AppIcon className="powerCapDisclaimer" icon={faExclamationTriangle} />
      </PressTip>
    );
  }

  return null;
}
