import {
  ObjectiveDescription,
  ObjectiveProgress,
  ObjectiveProgressBar,
  ObjectiveText,
} from 'app/progress/Objective';
import { DestinyCharacterProgressionComponent } from 'bungie-api-ts/destiny2';
import xpIcon from '../../images/xpIcon.svg';
import styles from './ArtifactXP.m.scss';

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
  return (
    <>
      <ObjectiveProgress>
        <ObjectiveProgressBar
          className={styles.artifactProgress}
          progress={progressToNextLevel}
          completionValue={nextLevelAt}
        />
        <ObjectiveDescription
          icon={<img src={xpIcon} className={styles.xpIcon} />}
          description={(level + 1).toLocaleString()}
        />
        <ObjectiveText>
          {progressToNextLevel.toLocaleString()}
          <wbr />/<wbr />
          {nextLevelAt.toLocaleString()}
        </ObjectiveText>
      </ObjectiveProgress>
    </>
  );
}
