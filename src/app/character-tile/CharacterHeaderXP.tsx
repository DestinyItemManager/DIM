import React from 'react';
import clsx from 'clsx';
import { t } from 'app/i18next-t';

import { D1Store } from '../inventory/store-types';
import PressTip from '../dim-ui/PressTip';
import { percent } from '../shell/filters';

function getLevelBar(store: D1Store) {
  if (store.percentToNextLevel) {
    return {
      levelBar: store.percentToNextLevel,
      xpTillMote: undefined,
    };
  }
  if (store.progression?.progressions) {
    const prestige = store.progression.progressions.find((p) => p.progressionHash === 2030054750); // some kind of d1 hash
    if (prestige) {
      const data = {
        level: prestige.level,
        exp: prestige.nextLevelAt - prestige.progressToNextLevel,
      };
      return {
        xpTillMote: t('Stats.Prestige', data),
        levelBar: prestige.progressToNextLevel / prestige.nextLevelAt,
      };
    }
  }
  return {
    levelBar: 0,
    xpTillMote: undefined,
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
