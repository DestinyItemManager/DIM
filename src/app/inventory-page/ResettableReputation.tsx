import { t, tl } from 'app/i18next-t';
import { profileResponseSelector } from 'app/inventory/selectors';
import { rankProgressionHashesSelector, useD2Definitions } from 'app/manifest/selectors';
import { ReputationRankIcon } from 'app/progress/ReputationRank';
import { getCharacterProgressions } from 'app/progress/selectors';
import { unadvertisedResettableVendors } from 'app/search/d2-known-values';
import { sumBy } from 'app/utils/collections';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import * as styles from './ResettableReputation.m.scss';

export function ResettableReputation() {
  const defs = useD2Definitions();
  const profileInfo = useSelector(profileResponseSelector);
  const firstCharacterProgression = getCharacterProgressions(profileInfo)?.progressions ?? {};
  const progressionHashes = useSelector(rankProgressionHashesSelector);

  if (!defs) {
    return null;
  }

  const maxedReputations = progressionHashes
    .map((progressionHash) => firstCharacterProgression[progressionHash])
    .filter((progress) => {
      if (!progress) {
        return false;
      }

      const canReset =
        typeof progress.currentResetCount === 'number' ||
        unadvertisedResettableVendors.includes(progress.progressionHash);

      if (!canReset) {
        return false;
      }

      const progressionDef = defs.Progression.get(progress.progressionHash);
      const rankTotal = sumBy(progressionDef.steps, (cur) => cur.progressTotal);
      const rankPercent = Math.floor((progress.currentProgress / rankTotal) * 100);

      return rankPercent === 100;
    });

  return (
    <div className={clsx('store-row', styles.reputationRow)}>
      {maxedReputations.map((progress) => {
        const repName = defs.Progression.get(progress.progressionHash).displayProperties.name;
        const description = t(tl('Progress.PercentPrestige'), {
          pct: 100,
        });
        const textInfo = `${repName}: ${description}`;

        return (
          <div key={progress.progressionHash} title={textInfo}>
            <span className="sr-only">{textInfo}</span>
            <ReputationRankIcon progress={progress} />
          </div>
        );
      })}
    </div>
  );
}
