import {
  DestinyFactionDefinition,
  DestinyFactionProgression,
  DestinyInventoryComponent,
  DestinyItemComponent,
  DestinyProgression,
  DestinyCharacterComponent
  } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { bungieNetPath } from '../dim-ui/bungie-image';
import { sum } from '../util';
import { $state } from '../ngimport-more';
import './faction.scss';
import { PressTip } from '../dim-ui/press-tip';

interface FactionProps {
  factionProgress: DestinyFactionProgression;
  profileInventory: DestinyInventoryComponent;
  defs: D2ManifestDefinitions;
  character: DestinyCharacterComponent;
}

export function Faction(props: FactionProps) {
  const { defs, factionProgress, profileInventory, character } = props;

  const factionDef = defs.Faction[factionProgress.factionHash];

  const engramsAvailable = calculateEngramsAvailable(profileInventory, factionDef, factionProgress);

  const vendorIndex = factionProgress.factionVendorIndex === -1 ? 0 : factionProgress.factionVendorIndex;
  const vendorHash = factionDef.vendors[vendorIndex].vendorHash;

  const vendorDef = defs.Vendor.get(vendorHash);

  const rewardClick = () => $state.go('destiny2.vendor', { id: factionDef.rewardVendorHash, characterId: character.characterId });

  return (
    <div
      className={classNames("faction", { 'faction-unavailable': factionProgress.factionVendorIndex === -1 })}
    >
      <PressTip tooltip={`${factionProgress.progressToNextLevel}/${factionProgress.nextLevelAt}`}>
        <div><FactionIcon factionDef={factionDef} factionProgress={factionProgress}/></div>
      </PressTip>
      <div className="faction-info">
        <div className="faction-name" title={vendorDef.displayProperties.description}>{vendorDef.displayProperties.name}</div>
        <div className="faction-level" title={factionDef.displayProperties.description}>{factionDef.displayProperties.name}</div>
        {engramsAvailable > 0 &&
          <div className="faction-rewards">
            {factionDef.rewardVendorHash && $featureFlags.vendors
              ? <a onClick={rewardClick}>{t('Faction.EngramsAvailable', { count: engramsAvailable })}</a>
              : <>{t('Faction.EngramsAvailable', { count: engramsAvailable })}</>
            }
          </div>
        }
      </div>
    </div>
  );
}

export function FactionIcon(props: {
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

/**
 * Calculate how many engrams you could get if you turned in all your rep items for this faction.
 */
function calculateEngramsAvailable(profileInventory: DestinyInventoryComponent, factionDef: DestinyFactionDefinition, factionProgress: DestinyFactionProgression): number {
  const totalXPAvailable: number = sum(profileInventory.items, (item: DestinyItemComponent) => {
    return (factionDef.tokenValues[item.itemHash] || 0) * item.quantity;
  });

  return Math.floor((factionProgress.progressToNextLevel + totalXPAvailable) / factionProgress.nextLevelAt);
}
