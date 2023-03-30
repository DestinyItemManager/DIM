import { useDynamicStringReplacer } from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyProgression } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import BungieImage, { bungieNetPath } from '../dim-ui/BungieImage';
import CompletionCheckbox from './CompletionCheckbox';
import styles from './ReputationRank.m.scss';

/**
 * displays a single reputation rank for the account
 */
export function ReputationRank({
  progress,
  streak,
  resetCount,
}: {
  progress: DestinyProgression;
  streak?: DestinyProgression;
  resetCount?: number;
}) {
  const defs = useD2Definitions()!;
  const replacer = useDynamicStringReplacer();
  const progressionDef = defs.Progression.get(progress.progressionHash);

  const step = progressionDef.steps[Math.min(progress.level, progressionDef.steps.length - 1)];

  const rankTotal = _.sumBy(progressionDef.steps, (cur) => cur.progressTotal);

  const streakCheckboxes = streak && Array(5).fill(true).fill(false, streak.currentProgress);

  // language-agnostic css class name to identify which rank type we are in
  const factionClass = `faction-${progress.progressionHash}`;

  return (
    <div
      className={clsx(factionClass, styles.activityRank)}
      title={replacer(progressionDef.displayProperties.description)}
    >
      <div>
        <ReputationRankIcon progress={progress} />
      </div>
      <div className={styles.factionInfo}>
        <div className={styles.factionLevel}>
          {t('Progress.Rank', {
            name: progressionDef.displayProperties.name,
            rank: progress.level + 1,
          })}
        </div>
        <div className={styles.factionName}>{step.stepName}</div>
        <div className={styles.factionLevel}>
          <BungieImage className={styles.rankIcon} src={progressionDef.rankIcon} />
          {progress.currentProgress} ({progress.progressToNextLevel} / {progress.nextLevelAt})
        </div>
        {streakCheckboxes && (
          <div className={clsx(styles.winStreak, 'objective-row')}>
            {streakCheckboxes.map((c, i) => (
              <CompletionCheckbox key={i} completed={c} />
            ))}
          </div>
        )}
        <div className={styles.factionLevel}>
          {t('Progress.PercentPrestige', {
            pct: Math.round((progress.currentProgress / rankTotal) * 100),
          })}
        </div>
        {Boolean(resetCount) && (
          <div className={styles.factionLevel}>{t('Progress.Resets', { count: resetCount })}</div>
        )}
      </div>
    </div>
  );
}

function ReputationRankIcon({ progress }: { progress: DestinyProgression }) {
  const defs = useD2Definitions()!;

  const progressionDef = defs.Progression.get(progress.progressionHash);

  const step = progressionDef.steps[Math.min(progress.level, progressionDef.steps.length - 1)];

  const rankTotal = _.sumBy(progressionDef.steps, (step) => step.progressTotal);

  const circumference = 2 * 22 * Math.PI;
  const circumference2 = 2 * 25 * Math.PI;

  return (
    <div className={styles.crucibleRankIcon}>
      <svg viewBox="0 0 54 54">
        <circle r="27" cx="27" cy="27" fill="#555" />
        <circle r="21" cx="27" cy="27" fill="#222" />
        {progress.progressToNextLevel > 0 && (
          <circle
            r="22.5"
            cx="-27"
            cy="27"
            transform="rotate(-90)"
            className={styles.crucibleRankProgress}
            strokeWidth="3"
            strokeDasharray={`${
              (circumference * progress.progressToNextLevel) / progress.nextLevelAt
            } ${circumference}`}
            stroke={`rgb(${progressionDef.color.red}, ${progressionDef.color.green},${progressionDef.color.blue})`}
          />
        )}
        {progress.currentProgress > 0 && (
          <circle
            r="25.5"
            cx="-27"
            cy="27"
            transform="rotate(-90)"
            className={styles.crucibleRankTotalProgress}
            strokeWidth="3"
            strokeDasharray={`${
              (circumference2 * progress.currentProgress) / rankTotal
            } ${circumference2}`}
          />
        )}
        <image xlinkHref={bungieNetPath(step.icon)} width="40" height="40" x="7" y="7" />
      </svg>
    </div>
  );
}
