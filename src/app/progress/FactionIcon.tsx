import {
  DestinyFactionDefinition,
  DestinyProgression,
  DestinyVendorComponent,
} from 'bungie-api-ts/destiny2';
import { bungieNetPath } from '../dim-ui/BungieImage';
import DiamondProgress from '../dim-ui/DiamondProgress';
import * as styles from './FactionIcon.m.scss';

export default function FactionIcon({
  factionProgress,
  factionDef,
  vendor,
}: {
  factionProgress: DestinyProgression;
  factionDef: DestinyFactionDefinition;
  vendor?: DestinyVendorComponent;
}) {
  const level = (vendor?.progression?.level ?? factionProgress.level) + 1;

  return (
    <DiamondProgress
      icon={bungieNetPath(factionDef.displayProperties.icon)}
      level={level}
      className={styles.factionIcon}
      progress={factionProgress.progressToNextLevel / factionProgress.nextLevelAt}
    />
  );
}
