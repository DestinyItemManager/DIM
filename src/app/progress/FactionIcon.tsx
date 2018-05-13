import {
  DestinyFactionDefinition,
  DestinyProgression
} from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import * as React from 'react';
import { bungieNetPath } from '../dim-ui/bungie-image';
import './faction.scss';

export default function FactionIcon(props: {
  factionProgress: DestinyProgression;
  factionDef: DestinyFactionDefinition;
}) {
  const { factionProgress, factionDef } = props;

  const style = {
    strokeDashoffset: 121.622368 - (121.622368 * factionProgress.progressToNextLevel) / factionProgress.nextLevelAt
  };

  return (
    <div className="faction-icon">
      <svg viewBox="0 0 48 48">
        <image xlinkHref={bungieNetPath(factionDef.displayProperties.icon)} width="48" height="48" />
        {factionProgress.progressToNextLevel > 0 &&
          <polygon strokeDasharray="121.622368" style={style} fillOpacity="0" stroke="#FFF" strokeWidth="3" points="24,2.5 45.5,24 24,45.5 2.5,24" strokeLinecap="butt"/>
        }
      </svg>
      <div className={classNames('item-stat', 'item-faction', { 'purchase-unlocked': factionProgress.level >= 10 })}>{factionProgress.level}</div>
    </div>
  );
}
