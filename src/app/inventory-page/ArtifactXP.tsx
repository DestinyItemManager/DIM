import { percent } from 'app/shell/filters';
import { DestinyCharacterProgressionComponent } from 'bungie-api-ts/destiny2';
import React from 'react';
import xpIcon from '../../images/xpIcon.svg';
import styles from './ArtifactXP.m.scss';
const formatter = new Intl.NumberFormat();

export function ArtifactXP(characterProgress: DestinyCharacterProgressionComponent | undefined) {
  const artifactProgress =
    characterProgress?.progressions[243419342] ?? // to-do: this is not a fixed hash
    ({} as { progressToNextLevel: undefined; nextLevelAt: undefined; level: undefined });
  const { progressToNextLevel, nextLevelAt, level } = artifactProgress;

  if (!progressToNextLevel || !nextLevelAt || level === undefined) {
    return;
  }
  const progressBarStyle = {
    width: percent(progressToNextLevel / nextLevelAt),
  };
  return (
    <div className="objective-progress">
      <div className="objective-progress-bar" style={progressBarStyle} />
      <div className="objective-description">
        <img src={xpIcon} className={styles.xpIcon} /> {level + 1}
      </div>
      <div className="objective-text">
        {formatter.format(progressToNextLevel)} / {formatter.format(nextLevelAt)}
      </div>
    </div>
  );
}
