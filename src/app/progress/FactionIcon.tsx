import {
  DestinyFactionDefinition,
  DestinyProgression,
  DestinyVendorComponent
} from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { bungieNetPath } from '../dim-ui/BungieImage';
import './faction.scss';
import DiamondProgress from '../dim-ui/DiamondProgress';

export default function FactionIcon(props: {
  factionProgress: DestinyProgression;
  factionDef: DestinyFactionDefinition;
  vendor?: DestinyVendorComponent;
}) {
  const { factionProgress, factionDef, vendor } = props;

  const level =
    vendor && vendor.seasonalRank !== undefined ? vendor.seasonalRank : factionProgress.level;

  return (
    <DiamondProgress
      icon={bungieNetPath(factionDef.displayProperties.icon)}
      level={level}
      className="faction-icon"
      progress={factionProgress.progressToNextLevel / factionProgress.nextLevelAt}
    />
  );
}
