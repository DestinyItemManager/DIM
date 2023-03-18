import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { compareBy } from 'app/utils/comparators';
import { uniqBy } from 'app/utils/util';
import { DestinyMilestone, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { getEngramPowerBonus } from './engrams';
import { milestoneToItems } from './milestone-items';
import styles from './Milestones.m.scss';
import { PowerCaps } from './PowerCaps';
import Pursuit from './Pursuit';
import { sortPursuits } from './Pursuits';
import SeasonalRank from './SeasonalRank';
import { getCharacterProgressions } from './selectors';
import WellRestedPerkIcon from './WellRestedPerkIcon';

/**
 * The list of Milestones for a character. Milestones are different from pursuits and
 * represent challenges, story prompts, and other stuff you can do not represented by Pursuits.
 */
export default function Milestones({
  profileInfo,
  store,

  buckets,
}: {
  store: DimStore;
  profileInfo: DestinyProfileResponse;
  buckets: InventoryBuckets;
}) {
  const defs = useD2Definitions()!;
  const profileMilestones = milestonesForProfile(defs, profileInfo, store.id);
  const characterProgressions = getCharacterProgressions(profileInfo, store.id);
  const season = profileInfo.profile?.data?.currentSeasonHash
    ? defs.Season.get(profileInfo.profile.data.currentSeasonHash)
    : undefined;
  const seasonPass = season?.seasonPassHash
    ? defs.SeasonPass.get(season.seasonPassHash)
    : undefined;

  const milestoneItems = uniqBy(
    [...milestonesForCharacter(defs, profileInfo, store), ...profileMilestones],
    (m) => m.milestoneHash
  ).flatMap((milestone) => milestoneToItems(milestone, defs, buckets, store));

  const milestonesByPower = _.groupBy(milestoneItems, (m) => {
    for (const reward of m.pursuit?.rewards ?? []) {
      const powerBonus = getEngramPowerBonus(
        reward.itemHash,
        store?.stats.maxGearPower?.value,
        m.hash
      );
      return powerBonus;
    }
  });

  const sortPowerBonus = compareBy(
    (powerBonus: string) => -(powerBonus === 'undefined' ? -1 : parseInt(powerBonus, 10))
  );

  return (
    <>
      {characterProgressions && (
        <div className="progress-for-character">
          <SeasonalRank
            store={store}
            characterProgressions={characterProgressions}
            season={season}
            seasonPass={seasonPass}
            profileInfo={profileInfo}
          />
          <WellRestedPerkIcon
            progressions={characterProgressions}
            season={season}
            seasonPass={seasonPass}
          />
          <PowerCaps />
        </div>
      )}
      {Object.keys(milestonesByPower)
        .sort(sortPowerBonus)
        .map((powerBonus) => (
          <div key={powerBonus}>
            <h2 className={styles.header}>
              {powerBonus === 'undefined'
                ? t('Progress.PowerBonusHeaderUndefined')
                : t('Progress.PowerBonusHeader', { powerBonus })}
            </h2>
            <div className="progress-for-character">
              {milestonesByPower[powerBonus].sort(sortPursuits).map((item) => (
                <Pursuit key={item.hash} item={item} />
              ))}
            </div>
          </div>
        ))}
    </>
  );
}

/**
 * Get all the milestones that are valid across the whole profile. This still requires a character (any character)
 * to look them up, and the assumptions underlying this may get invalidated as the game evolves.
 */
function milestonesForProfile(
  defs: D2ManifestDefinitions,
  profileInfo: DestinyProfileResponse,
  characterId: string
): DestinyMilestone[] {
  const profileMilestoneData = profileInfo.characterProgressions?.data?.[characterId]?.milestones;
  const allMilestones: DestinyMilestone[] = profileMilestoneData
    ? Object.values(profileMilestoneData)
    : [];

  const filteredMilestones = allMilestones.filter(
    (milestone) =>
      !milestone.availableQuests &&
      !milestone.activities &&
      (!milestone.vendors || milestone.rewards) &&
      defs.Milestone.get(milestone.milestoneHash)
  );

  return _.sortBy(filteredMilestones, (milestone) => milestone.order);
}

/**
 * Get all the milestones to show for a particular character, filtered to active milestones and sorted.
 */
function milestonesForCharacter(
  defs: D2ManifestDefinitions,
  profileInfo: DestinyProfileResponse,
  character: DimStore
): DestinyMilestone[] {
  const characterMilestoneData = getCharacterProgressions(profileInfo, character.id)?.milestones;
  const allMilestones: DestinyMilestone[] = characterMilestoneData
    ? Object.values(characterMilestoneData)
    : [];

  const filteredMilestones = allMilestones.filter((milestone) => {
    const def = defs.Milestone.get(milestone.milestoneHash);
    return (
      def &&
      (def.showInExplorer || def.showInMilestones) &&
      (milestone.activities ||
        !milestone.availableQuests ||
        milestone.availableQuests.every(
          (q) =>
            q.status.stepObjectives.length > 0 &&
            q.status.started &&
            (!q.status.completed || !q.status.redeemed)
        ))
    );
  });

  return _.sortBy(filteredMilestones, (milestone) => milestone.order);
}
