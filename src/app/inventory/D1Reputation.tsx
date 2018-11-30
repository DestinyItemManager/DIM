import * as React from 'react';
import { D1Store } from './store-types';
import DiamondProgress from '../dim-ui/DiamondProgress';
import * as _ from 'lodash';
import PressTip from '../dim-ui/PressTip';
import { bungieNetPath } from '../dim-ui/BungieImage';
import './D1Reputation.scss';

export default function D1Reputation({ store }: { store: D1Store }) {
  if (!store.progression) {
    return null;
  }
  const progressions = _.sortBy(store.progression.progressions, (p) => p.order);
  return (
    <div className="sub-section sort-progression">
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
    </div>
  );
}
