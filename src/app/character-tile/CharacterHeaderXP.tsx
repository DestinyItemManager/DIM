import React from 'react';
import clsx from 'clsx';
import { t } from 'app/i18next-t';

import { D1Store } from '../inventory/store-types';
import PressTip from '../dim-ui/PressTip';
import { percent } from '../shell/filters';
import { D1ProgressionHashes } from 'app/search/d1-known-values';

function getLevelBar(store: D1Store) {
  const prestige = store.progression?.progressions.find(
    (p) => p.progressionHash === D1ProgressionHashes.Prestige
  );
  const data = {
    level: prestige?.level,
    exp: prestige?.level ? prestige?.nextLevelAt - prestige?.progressToNextLevel : 0,
  };
  return {
    levelBar: prestige?.level
      ? prestige.progressToNextLevel / prestige.nextLevelAt
      : store?.percentToNextLevel ?? 0,
    xpTillMote: prestige?.level ? t('Stats.Prestige', data) : undefined,
  };
}

// This is just a D1 feature, so it only accepts a D1 store.
export const CharacterHeaderXPBar = ({ store }: { store: D1Store }) => {
  const { levelBar, xpTillMote } = getLevelBar(store);
  return (
    <PressTip tooltip={xpTillMote}>
      <div className="level-bar">
        <div
          className={clsx('level-bar-progress', {
            'mote-progress': !store.percentToNextLevel,
          })}
          style={{ width: percent(levelBar) }}
        />
      </div>
    </PressTip>
  );
};
