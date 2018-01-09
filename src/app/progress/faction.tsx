import * as React from 'react';
import * as _ from 'underscore';
import classNames from 'classnames';
import { t } from 'i18next';

import { DestinyFactionProgression, DestinyInventoryComponent, DestinyItemComponent, DestinyFactionDefinition } from 'bungie-api-ts/destiny2';
import { sum } from '../util';
import { bungieNetPath } from '../dim-ui/bungie-image';
import './faction.scss';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';

interface FactionProps {
  factionProgress: DestinyFactionProgression;
  profileInventory: DestinyInventoryComponent;
  defs: D2ManifestDefinitions;
}

export function Faction(props: FactionProps) {
  const { defs, factionProgress, profileInventory } = props;
  const factionDef = defs.Faction[factionProgress.factionHash];

  const style = {
    strokeDashoffset: 121.622368 - (121.622368 * factionProgress.progressToNextLevel) / factionProgress.nextLevelAt
  };

  const engramsAvailable = calculateEngramsAvailable(profileInventory, factionDef, factionProgress);

  return (
    <div className="faction">
      <div className="faction-icon">
        <svg viewBox="0 0 48 48">
          <image xlinkHref={bungieNetPath(factionDef.displayProperties.icon)} width="48" height="48" />
          {factionProgress.progressToNextLevel > 0 &&
            <polygon strokeDasharray="121.622368" style={style} fillOpacity="0" stroke="#FFF" strokeWidth="3" points="24,2.5 45.5,24 24,45.5 2.5,24" strokeLinecap="butt"/>
          }
        </svg>
        <div className={classNames('item-stat', 'item-faction', { 'purchase-unlocked': factionProgress.level >= 10 })}>{factionProgress.level}</div>
      </div>
      <div className="faction-info">
        <div className="faction-name" title={factionDef.displayProperties.description}>{factionDef.displayProperties.name}</div>
        <div className="faction-level">{factionProgress.progressToNextLevel}/{factionProgress.nextLevelAt}</div>
        {engramsAvailable > 0 &&
          <div className="faction-rewards">{t('Faction.EngramsAvailable', { count: engramsAvailable })}</div>
        }
      </div>
    </div>
  );
}

/**
 * Calculate how many engrams you could get if you turned in all your rep items for this faction.
 */
function calculateEngramsAvailable(profileInventory: DestinyInventoryComponent, factionDef: DestinyFactionDefinition, factionProgress: DestinyFactionProgression): number {
  const totalXPAvailable: number = sum(profileInventory.items, (item: DestinyItemComponent) => {
    return (factionDef.tokenValues[item.itemHash] || 0) * item.quantity;
  });

  return Math.floor((factionProgress.progressToNextLevel + totalXPAvailable) / factionProgress.nextLevelAt);
}
