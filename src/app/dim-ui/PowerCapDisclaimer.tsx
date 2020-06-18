import React from 'react';
import { AppIcon, faExclamationTriangle } from '../shell/icons';
import PressTip from 'app/dim-ui/PressTip';
import { DimItem } from 'app/inventory/item-types';
import './PowerCapDisclaimer.scss';
import { t } from 'app/i18next-t';
import missingSources from 'data/d2/missing-source-info';

// temporarily, we are adding warnings to these sourceHashes
// because they display an incorrect Power Limit
export const powerCapDisclaimer = [
  2455011338, // last wish
  1491707941, // gos
];

export function PowerCapDisclaimer({ item }: { item: DimItem }) {
  if (
    !item.isDestiny2() || // check the easy stuff first
    item.powerCap !== 1060 || // to try and avoid doing
    (!powerCapDisclaimer.includes(item.source) && !missingSources.lastwish.includes(item.hash)) // the more expensive lookup
  )
    return null;
  return (
    <PressTip elementType="span" tooltip={t('Stats.PowerCapDisclaimer')}>
      <AppIcon className="powerCapDisclaimer" icon={faExclamationTriangle} />
    </PressTip>
  );
}
