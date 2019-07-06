import React from 'react';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { CrucibleRank } from './CrucibleRank';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';

/**
 * Crucible and Gambit ranks for the account.
 */
export default function Ranks({
  profileInfo,
  defs
}: {
  profileInfo: DestinyProfileResponse;
  defs: D2ManifestDefinitions;
}) {
  const firstCharacterProgression = profileInfo.characterProgressions.data
    ? Object.values(profileInfo.characterProgressions.data)[0].progressions
    : {};
  const crucibleRanks = [
    // Valor
    firstCharacterProgression[2626549951],
    // Glory
    firstCharacterProgression[2000925172],
    // Infamy
    firstCharacterProgression[2772425241]
  ];

  return (
    <div className="progress-for-character ranks-for-character">
      {crucibleRanks.map(
        (progression) =>
          progression && (
            <CrucibleRank key={progression.progressionHash} defs={defs} progress={progression} />
          )
      )}
    </div>
  );
}
