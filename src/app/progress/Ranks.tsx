import { rankProgressionHashesSelector } from 'app/manifest/selectors';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React from 'react';
import { useSelector } from 'react-redux';
import { CrucibleRank } from './CrucibleRank';
import { getCharacterProgressions } from './selectors';

// There are 2 similar DestinyProgression definitions for each rank
// system. The rank progression definition contains detailed rank names and
// resetInfo, while the streak progression definition contains information about
// current streak status. There is no way to map between them automatically, so
// this table must be kept up to date manually, by pasting the following code
// into the body of the component while you have some streaks and using that to
// figure out which unmapped streak progression matches with which rank
// progression:
//
// const defs = useD2Definitions()!;
// const progressions = Object.values(defs.Progression.getAll()).filter(
//   (d) =>
//     d.scope === DestinyProgressionScope.MappedUnlockValue &&
//     d.steps?.length === 5 &&
//     !Object.values(rankProgressionToStreakProgression).includes(d.hash)
// );
// console.log(
//   progressions.map((p) => ({
//     hash: p.hash,
//     streak: firstCharacterProgression[p.hash].stepIndex,
//   })),
//   progressionHashes.map((p) => ({
//     name: defs?.Progression.get(p).displayProperties.name,
//     hash: p,
//   }))
// );

const rankProgressionToStreakProgression = {
  2083746873: 2203850209, // Valor
  1647151960: 2572719399, // Glory
  3008065600: 2939151659, // Infamy
  457612306: 600547406, // Vanguard
  2755675426: 70699614, // Trials
  527867935: 1999336308, // Strange Favor (Dares of Eternity)
};

/**
 * Displays all ranks for the account
 */
export default function Ranks({ profileInfo }: { profileInfo: DestinyProfileResponse }) {
  const firstCharacterProgression = getCharacterProgressions(profileInfo)?.progressions ?? {};
  const progressionHashes = useSelector(rankProgressionHashesSelector);

  return (
    <div className="progress-for-character ranks-for-character">
      {progressionHashes.map(
        (progressionHash) =>
          firstCharacterProgression[progressionHash] && (
            <CrucibleRank
              key={progressionHash}
              progress={firstCharacterProgression[progressionHash]}
              streak={
                firstCharacterProgression[rankProgressionToStreakProgression[progressionHash]]
              }
            />
          )
      )}
    </div>
  );
}
