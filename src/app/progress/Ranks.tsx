import { rankProgressionHashesSelector } from 'app/manifest/selectors';
import { LookupTable } from 'app/utils/util-types';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { ProgressionHashes } from 'data/d2/generated-enums';
import { useSelector } from 'react-redux';
import PursuitGrid from './PursuitGrid';
import { ReputationRank } from './ReputationRank';
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

const rankProgressionToStreakProgression: LookupTable<ProgressionHashes, number> = {
  [ProgressionHashes.StrangeFavor]: 1999336308,
};

// This set contains progression hashes that should not be displayed in the
// Ranks component. The API still returns them, but they are no longer visible
// in the game.
const hideProgressionHashes = new Set([
  784742260, // Engram Ensiders (Rahool)
  2411069437, // Gunsmith Rank
  1471185389, // Xûr Rank
  527867935, // Strange Favor (Dares of Eternity)
]);

// This doesn't show up in the automatic progression hashes, but it is mildly
// useful in that it will affect your Crucible reward multiplier.
const crucibleRewardRankProgressionHash = 2206541810;

/**
 * Displays all ranks for the account
 */
export default function Ranks({ profileInfo }: { profileInfo: DestinyProfileResponse }) {
  const firstCharacterProgression = getCharacterProgressions(profileInfo)?.progressions ?? {};
  const progressionHashes = useSelector(rankProgressionHashesSelector);

  return (
    <PursuitGrid ranks>
      {[crucibleRewardRankProgressionHash, ...progressionHashes].map(
        (progressionHash) =>
          !hideProgressionHashes.has(progressionHash) &&
          firstCharacterProgression[progressionHash] && (
            <ReputationRank
              key={progressionHash}
              progress={firstCharacterProgression[progressionHash]}
              streak={
                firstCharacterProgression[rankProgressionToStreakProgression[progressionHash] ?? 0]
              }
              isProgressRanks
            />
          ),
      )}
    </PursuitGrid>
  );
}
