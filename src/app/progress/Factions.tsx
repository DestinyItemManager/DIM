import React from 'react';
import { DimStore } from 'app/inventory/store-types';
import {
  DestinyFactionProgression,
  DestinyProfileResponse,
  DestinyVendorComponent,
  DestinyVendorsResponse
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { Faction } from './Faction';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';

const factionOrder = [
  611314723, // Vanguard,
  3231773039, // Vanguard Research,
  697030790, // Crucible,
  1021210278, // Gunsmith,

  4235119312, // EDZ Deadzone Scout,
  4196149087, // Titan Field Commander,
  1660497607, // Nessus AI,
  828982195, // Io Researcher,
  3859807381, // Voice of Rasputin,
  2677528157, // Follower of Osiris,
  24856709, // Leviathan,

  469305170, // The Nine,
  1761642340, // Iron Banner,

  2105209711, // New Monarchy,
  1714509342, // Future War Cult,
  3398051042 // Dead Orbit
];

/**
 * Display all the factions for a character.
 */
export default function Factions({
  store,
  profileInfo,
  vendors,
  defs
}: {
  store: DimStore;
  profileInfo: DestinyProfileResponse;
  vendors?: { [characterId: string]: DestinyVendorsResponse };
  defs: D2ManifestDefinitions;
}) {
  const allFactions = profileInfo?.characterProgressions?.data?.[store.id]?.factions || {};
  const factions = _.sortBy(Object.values(allFactions), (f) => {
    const order = factionOrder.indexOf(f.factionHash);
    return (order >= 0 ? order : 999) + (f.factionVendorIndex === -1 ? 1000 : 0);
  });

  return (
    <div className="progress-for-character">
      {factions.map(
        (faction) =>
          profileInfo.profileInventory.data && (
            <Faction
              factionProgress={faction}
              defs={defs}
              characterId={store.id}
              profileInventory={profileInfo.profileInventory.data}
              key={faction.factionHash}
              vendor={vendorForFaction(defs, vendors, store.id, faction)}
            />
          )
      )}
    </div>
  );
}

function vendorForFaction(
  this: void,
  defs: D2ManifestDefinitions,
  vendors: { [characterId: string]: DestinyVendorsResponse } | undefined,
  characterId: string,
  faction: DestinyFactionProgression
): DestinyVendorComponent | undefined {
  if (faction.factionVendorIndex < 0) {
    return undefined;
  }

  if (!defs || !vendors) {
    return undefined;
  }

  const factionDef = defs.Faction[faction.factionHash];
  const vendorHash = factionDef.vendors[faction.factionVendorIndex].vendorHash;
  return vendors[characterId] && vendors[characterId].vendors.data
    ? vendors[characterId].vendors.data![vendorHash]
    : undefined;
}
