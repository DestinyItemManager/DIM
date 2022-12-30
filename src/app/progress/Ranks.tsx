import { profileResponseSelector } from 'app/inventory/selectors';
import { rankProgressionHashesSelector } from 'app/manifest/selectors';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { ProgressionHashes } from 'data/d2/generated-enums';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
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

const rankProgressionToStreakProgression = {
  [ProgressionHashes.CrucibleRank]: 2203850209,
  [ProgressionHashes.GloryRank]: 2572719399,
  [ProgressionHashes.GambitRank]: 2939151659,
  [ProgressionHashes.VanguardRank]: 600547406,
  [ProgressionHashes.StrangeFavor]: 1999336308,
};

const WeeklyBonusModifierHashes = {
  745014575: ProgressionHashes.VanguardRank, // Double Vanguard Rank
  3874605433: ProgressionHashes.CrucibleRank, // Double Crucible Rank
  3228023383: ProgressionHashes.GambitRank, // Double Gambit Rank
  1361609633: ProgressionHashes.TrialsRank, // Double Trials Rank
};

function getWeeklyBonusRankModifier(profileInfo: DestinyProfileResponse) {
  if (profileInfo?.characterActivities?.data) {
    for (const activity of Object.values(profileInfo.characterActivities.data)[0]
      .availableActivities) {
      if (activity.activityHash !== 1113451448 && activity.modifierHashes) {
        for (const h of activity.modifierHashes) {
          if (h in WeeklyBonusModifierHashes) {
            return h;
          }
        }
      }
    }
  }
}

const weeklyBonusProgressionHashSelector = createSelector(
  profileResponseSelector,
  (profileInfo): number | undefined => {
    if (profileInfo) {
      const weeklyBonusModifier = getWeeklyBonusRankModifier(profileInfo);
      return weeklyBonusModifier && WeeklyBonusModifierHashes[weeklyBonusModifier];
    }
  }
);

/**
 * Displays all ranks for the account
 */
export default function Ranks({ profileInfo }: { profileInfo: DestinyProfileResponse }) {
  const firstCharacterProgression = getCharacterProgressions(profileInfo)?.progressions ?? {};
  const progressionHashes = useSelector(rankProgressionHashesSelector);
  const weeklyBonusProgressionHash = useSelector(weeklyBonusProgressionHashSelector);

  return (
    <div className="progress-for-character ranks-for-character">
      {progressionHashes.map(
        (progressionHash) =>
          firstCharacterProgression[progressionHash] && (
            <ReputationRank
              key={progressionHash}
              progress={firstCharacterProgression[progressionHash]}
              streak={
                firstCharacterProgression[rankProgressionToStreakProgression[progressionHash]]
              }
              resetCount={firstCharacterProgression[progressionHash]?.currentResetCount}
              bonusRank={progressionHash === weeklyBonusProgressionHash}
            />
          )
      )}
    </div>
  );
}
