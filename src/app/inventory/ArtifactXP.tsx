import { percent } from 'app/shell/formatters';
import { DestinyCharacterProgressionComponent } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import xpIcon from '../../images/xpIcon.svg';
import '../item-popup/ItemObjectives.scss';
import styles from './ArtifactXP.m.scss';
const formatter = new Intl.NumberFormat();

export function ArtifactXP({
  characterProgress,
  bonusPowerProgressionHash,
}: {
  characterProgress: DestinyCharacterProgressionComponent | undefined;
  bonusPowerProgressionHash: number | undefined;
}) {
  if (!bonusPowerProgressionHash) {
    return null;
  }
  const artifactProgress =
    characterProgress?.progressions[bonusPowerProgressionHash] ??
    ({} as { progressToNextLevel: undefined; nextLevelAt: undefined; level: undefined });
  const { progressToNextLevel, nextLevelAt, level } = artifactProgress;

  if (!progressToNextLevel || !nextLevelAt || level === undefined) {
    return null;
  }
  const progressBarStyle = {
    width: percent(progressToNextLevel / nextLevelAt),
  };
  return (
    <div className="objective-progress">
      <div
        className={clsx('objective-progress-bar', styles.artifactProgress)}
        style={progressBarStyle}
      />
      <div className="objective-description">
        <img src={xpIcon} className={styles.xpIcon} /> {level + 1}
      </div>
      <div className="objective-text">
        {formatter.format(progressToNextLevel)} / {formatter.format(nextLevelAt)}
      </div>
    </div>
  );
}
