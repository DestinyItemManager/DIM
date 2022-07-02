import { D1Store } from 'app/inventory/store-types';
import _ from 'lodash';
import { bungieNetPath } from '../dim-ui/BungieImage';
import DiamondProgress from '../dim-ui/DiamondProgress';
import PressTip, { PressTipHeader } from '../dim-ui/PressTip';
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
                  <PressTipHeader header={rep.faction.factionName} />
                  {rep.progressToNextLevel} / {rep.nextLevelAt}
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
