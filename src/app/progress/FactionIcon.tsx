import { bungieNetPath } from 'app/dim-ui/BungieImage';
import CircleProgress from 'app/dim-ui/CircleProgress';
import DiamondProgress from 'app/dim-ui/DiamondProgress';
import { useD2Definitions } from 'app/manifest/selectors';
import {
  DestinyFactionDefinition,
  DestinyProgression,
  DestinyVendorComponent,
} from 'bungie-api-ts/destiny2';
import React from 'react';
import styles from './FactionIcon.m.scss';

export default function FactionIcon(props: {
  factionProgress: DestinyProgression;
  factionDef: DestinyFactionDefinition;
  vendor?: DestinyVendorComponent;
}) {
  const { factionProgress, factionDef, vendor } = props;
  const defs = useD2Definitions()!;
  const level = (vendor?.seasonalRank ?? factionProgress.level) + 1;
  const vendorDef =
    (vendor?.vendorHash ? defs.Vendor.get(vendor.vendorHash) : undefined) ?? undefined;
  const progressionType = vendorDef?.vendorProgressionType;
  const icon2 = vendorDef?.displayProperties.smallTransparentIcon;

  if (progressionType) {
    return (
      <CircleProgress
        icon={bungieNetPath(factionDef.displayProperties.icon)}
        icon2={icon2 && bungieNetPath(icon2)}
        level={level}
        className={styles.factionIcon}
        progress={factionProgress.progressToNextLevel / factionProgress.nextLevelAt}
      />
    );
  }

  return (
    <DiamondProgress
      icon={bungieNetPath(factionDef.displayProperties.icon)}
      level={level}
      className={styles.factionIcon}
      progress={factionProgress.progressToNextLevel / factionProgress.nextLevelAt}
    />
  );
}
