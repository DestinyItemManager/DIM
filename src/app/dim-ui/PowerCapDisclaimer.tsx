import React from 'react';
import { AppIcon, faExclamationTriangle } from '../shell/icons';
import PressTip from 'app/dim-ui/PressTip';
import { DimItem } from 'app/inventory/item-types';
import './PowerCapDisclaimer.scss';
import { t } from 'app/i18next-t';

// temporarily, we are adding warnings to these sourceHashes
// because they display an incorrect Power Limit
export const powerCapDisclaimer = [
  2455011338, // last wish
  1491707941, // gos
];

const link =
  'https://www.reddit.com/r/DestinyTheGame/comments/h9wxur/will_we_have_to_regrind_our_raid_loot_bungie_help/fv0xa5v/';

export function PowerCapDisclaimer({ item }: { item: DimItem }) {
  return (
    (item.isDestiny2() && item.powerCap === 1060 && powerCapDisclaimer.includes(item.source) && (
      <PressTip elementType="span" tooltip={t('Stats.PowerCapDisclaimer', { link })}>
        <AppIcon className="powerCapDisclaimer" icon={faExclamationTriangle} />
      </PressTip>
    )) ||
    null
  );
}
