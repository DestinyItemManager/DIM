import {
  DestinyFactionDefinition,
  DestinyFactionProgression,
  DestinyInventoryComponent,
  DestinyItemComponent,
  DestinyVendorComponent
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { t } from 'app/i18next-t';
import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import './faction.scss';
import PressTip from '../dim-ui/PressTip';
import FactionIcon from './FactionIcon';
import { UISref } from '@uirouter/react';
import _ from 'lodash';

interface FactionProps {
  factionProgress: DestinyFactionProgression;
  vendor?: DestinyVendorComponent;
  profileInventory: DestinyInventoryComponent;
  defs: D2ManifestDefinitions;
  characterId: string;
}

export function Faction(props: FactionProps) {
  const { defs, factionProgress, profileInventory, characterId, vendor } = props;

  const factionDef = defs.Faction[factionProgress.factionHash];

  const engramsAvailable = calculateEngramsAvailable(profileInventory, factionDef, factionProgress);

  const vendorIndex =
    factionProgress.factionVendorIndex === -1 ? 0 : factionProgress.factionVendorIndex;
  const vendorHash = factionDef.vendors[vendorIndex].vendorHash;

  const vendorDef = defs.Vendor.get(vendorHash);

  return (
    <div
      className={clsx('faction', {
        'faction-unavailable': factionProgress.factionVendorIndex === -1
      })}
    >
      <PressTip tooltip={`${factionProgress.progressToNextLevel}/${factionProgress.nextLevelAt}`}>
        <div>
          <FactionIcon factionDef={factionDef} factionProgress={factionProgress} vendor={vendor} />
        </div>
      </PressTip>
      <div className="faction-info">
        <div className="faction-name" title={vendorDef.displayProperties.description}>
          <UISref to="destiny2.vendor" params={{ id: vendorHash, characterId }}>
            <a>{vendorDef.displayProperties.name}</a>
          </UISref>
        </div>
        <div className="faction-level" title={factionDef.displayProperties.description}>
          {factionDef.displayProperties.name}
        </div>
        <div className="faction-rewards">
          {factionDef.rewardVendorHash ? (
            <UISref to="destiny2.vendor" params={{ id: factionDef.rewardVendorHash, characterId }}>
              <a>{t('Faction.EngramsAvailable', { count: engramsAvailable })}</a>
            </UISref>
          ) : (
            <>{t('Faction.EngramsAvailable', { count: engramsAvailable })}</>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate how many engrams you could get if you turned in all your rep items for this faction.
 */
function calculateEngramsAvailable(
  profileInventory: DestinyInventoryComponent,
  factionDef: DestinyFactionDefinition,
  factionProgress: DestinyFactionProgression
): number {
  const totalXPAvailable: number = _.sumBy(profileInventory.items, (item: DestinyItemComponent) => {
    return ((factionDef.tokenValues && factionDef.tokenValues[item.itemHash]) || 0) * item.quantity;
  });

  return Math.floor(
    (factionProgress.progressToNextLevel + totalXPAvailable) / factionProgress.nextLevelAt
  );
}
