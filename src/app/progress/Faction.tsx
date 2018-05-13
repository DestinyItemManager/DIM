import {
  DestinyFactionDefinition,
  DestinyFactionProgression,
  DestinyInventoryComponent,
  DestinyItemComponent,
  DestinyCharacterComponent
} from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { sum } from '../util';
import { $state } from '../ngimport-more';
import './faction.scss';
import { PressTip } from '../dim-ui/press-tip';
import FactionIcon from './FactionIcon';

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
        <div className="faction-rewards">
          {factionDef.rewardVendorHash && $featureFlags.vendors
            ? <a onClick={rewardClick}>{t('Faction.EngramsAvailable', { count: engramsAvailable })}</a>
            : <>{t('Faction.EngramsAvailable', { count: engramsAvailable })}</>
          }
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate how many engrams you could get if you turned in all your rep items for this faction.
 */
function calculateEngramsAvailable(profileInventory: DestinyInventoryComponent, factionDef: DestinyFactionDefinition, factionProgress: DestinyFactionProgression): number {
  const totalXPAvailable: number = sum(profileInventory.items, (item: DestinyItemComponent) => {
    return ((factionDef.tokenValues && factionDef.tokenValues[item.itemHash]) || 0) * item.quantity;
  });

  return Math.floor((factionProgress.progressToNextLevel + totalXPAvailable) / factionProgress.nextLevelAt);
}
