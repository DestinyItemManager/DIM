import {
  DestinyFactionDefinition,
  DestinyProgression,
  DestinyVendorComponent,
} from 'bungie-api-ts/destiny2';
import React from 'react';
import { bungieNetPath } from '../dim-ui/BungieImage';
import DiamondProgress from '../dim-ui/DiamondProgress';
import styles from './FactionIcon.m.scss';

export default function FactionIcon(props: {
  factionProgress: DestinyProgression;
  factionDef: DestinyFactionDefinition;
  vendor?: DestinyVendorComponent;
}) {
  const { factionProgress, factionDef, vendor } = props;

  const level = vendor?.seasonalRank ?? factionProgress.level;

  return (
    <DiamondProgress
      icon={bungieNetPath(factionDef.displayProperties.icon)}
      level={level}
      className={styles.factionIcon}
      progress={factionProgress.progressToNextLevel / factionProgress.nextLevelAt}
    />
  );
}
