import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React from 'react';
import { CrucibleRank } from './CrucibleRank';
import { getCharacterProgressions } from './selectors';

/**
 * displays all Crucible and Gambit ranks for the account
 */
export default function Ranks({ profileInfo }: { profileInfo: DestinyProfileResponse }) {
  const firstCharacterProgression = getCharacterProgressions(profileInfo)?.progressions ?? {};

  // there are 2 similar DestinyProgression entries for each crucible point system
  // progressionInfo contains detailed rank names and resetInfo, streakInfo is contains
  // information about current strak status.
  const activityRanks = [
    {
      // Valor
      progressionInfo: firstCharacterProgression[2083746873],
      streakInfo: firstCharacterProgression[2203850209],
    },
    {
      // Glory
      progressionInfo: firstCharacterProgression[1647151960],
      streakInfo: firstCharacterProgression[2572719399],
    },
    {
      // Infamy
      progressionInfo: firstCharacterProgression[3008065600],
      streakInfo: firstCharacterProgression[2939151659],
    },
  ];

  return (
    <div className="progress-for-character ranks-for-character">
      {activityRanks.map(
        (activityRank) =>
          activityRank.progressionInfo && (
            <CrucibleRank
              key={activityRank.progressionInfo.progressionHash}
              progress={activityRank.progressionInfo}
              streak={activityRank.streakInfo}
            />
          )
      )}
    </div>
  );
}
