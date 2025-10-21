import { D1Store } from 'app/inventory/store-types';
import { compareBy } from 'app/utils/comparators';
import { bungieNetPath } from '../dim-ui/BungieImage';
import DiamondProgress from '../dim-ui/DiamondProgress';
import { PressTip, Tooltip } from '../dim-ui/PressTip';
import * as styles from './D1Reputation.m.scss';

export default function D1Reputation({ store }: { store: D1Store }) {
  if (!store.progressions.length) {
    return null;
  }
  const progressions = store.progressions.toSorted(compareBy((p) => p.order));
  return (
    <div className={styles.reputationBucket}>
      {progressions.map(
        (rep) =>
          rep.order >= 0 && (
            <PressTip
              key={rep.faction.hash}
              tooltip={
                <>
                  <Tooltip.Header text={rep.faction.factionName} />
                  {rep.progressToNextLevel} / {rep.nextLevelAt}
                </>
              }
            >
              <div className={styles.factionrep}>
                <DiamondProgress
                  icon={bungieNetPath(rep.faction.factionIcon)}
                  level={rep.level}
                  progress={rep.progressToNextLevel / rep.nextLevelAt}
                />
              </div>
            </PressTip>
          ),
      )}
    </div>
  );
}
