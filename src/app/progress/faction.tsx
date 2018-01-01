import * as React from 'react';
import * as _ from 'underscore';
import { IDestinyFactionProgression, IDestinyInventoryComponent, IDestinyItemInstanceComponent, IDestinyItemComponent } from '../bungie-api/interfaces';
import { sum } from '../util';
import { t } from 'i18next';
import { bungieNetPath } from '../dim-ui/bungie-image';
import './faction.scss';

interface FactionProps {
  factionProgress: IDestinyFactionProgression;
  profileInventory: IDestinyInventoryComponent;
  defs;
}

export function Faction(props: FactionProps) {
  const { defs, factionProgress, profileInventory } = props;
  const factionDef = defs.Faction[factionProgress.factionHash];

  const style = {
    strokeDashoffset: 121.622368 - (121.622368 * factionProgress.progressToNextLevel) / factionProgress.nextLevelAt
  };

  const engramsAvailable = calculateEngramsAvailable(profileInventory, factionDef, factionProgress);

  return <div className="faction">
    <div className="faction-icon">
      <svg viewBox="0 0 48 48">
        <image xlinkHref={bungieNetPath(factionDef.displayProperties.icon)} width="48" height="48" />
        {factionProgress.progressToNextLevel > 0 &&
          <polygon strokeDasharray="121.622368" style={style} fillOpacity="0" stroke="#FFF" strokeWidth="3" points="24,2.5 45.5,24 24,45.5 2.5,24" strokeLinecap="butt"/>
        }
      </svg>
      <div className={`item-stat item-faction ${factionProgress.level >= 10 ? 'purchase-unlocked' : ''}`}>{factionProgress.level}</div>
    </div>
    <div className="faction-info">
      <div className="faction-name" title={factionDef.displayProperties.description}>{factionDef.displayProperties.name}</div>
      <div className="faction-level">{factionProgress.progressToNextLevel}/{factionProgress.nextLevelAt}</div>
      {engramsAvailable > 0 &&
        <div className="faction-rewards">{t('Faction.EngramsAvailable', { count: engramsAvailable })}</div>
      }
    </div>
  </div>;
}

/**
 * Calculate how many engrams you could get if you turned in all your rep items for this faction.
 */
function calculateEngramsAvailable(profileInventory: IDestinyInventoryComponent, factionDef, factionProgress: IDestinyFactionProgression): number {
  const totalXPAvailable = sum(profileInventory.items, (item: IDestinyItemComponent) => {
    return (factionDef.tokenValues[item.itemHash] || 0) * item.quantity;
  });

  return Math.floor((factionProgress.progressToNextLevel + totalXPAvailable) / factionProgress.nextLevelAt);
}