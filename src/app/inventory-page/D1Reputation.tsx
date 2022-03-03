import { bungieNetPath } from 'app/dim-ui/BungieImage';
import DiamondProgress from 'app/dim-ui/DiamondProgress';
import PressTip from 'app/dim-ui/PressTip';
import { D1Store } from 'app/inventory/store-types';
import _ from 'lodash';
import React from 'react';
import './D1Reputation.scss';

export default function D1Reputation({ store }: { store: D1Store }) {
  if (!store.progressions.length) {
    return null;
  }
  const progressions = _.sortBy(store.progressions, (p) => p.order);
  return (
    <div className="reputation-bucket">
      {progressions.map(
        (rep) =>
          rep.order >= 0 && (
            <PressTip
              key={rep.faction.hash}
              tooltip={
                <>
                  <h2>{rep.faction.factionName}</h2>
                  {rep.progressToNextLevel}/{rep.nextLevelAt}
                </>
              }
            >
              <div className="factionrep">
                <DiamondProgress
                  icon={bungieNetPath(rep.faction.factionIcon)}
                  level={rep.level}
                  progress={rep.progressToNextLevel / rep.nextLevelAt}
                />
              </div>
            </PressTip>
          )
      )}
    </div>
  );
}
