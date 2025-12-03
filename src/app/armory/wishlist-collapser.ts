import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { compareBy } from 'app/utils/comparators';
import { enhancedVersion, unenhancedVersion } from 'app/utils/perk-utils';
import { WishListRoll } from 'app/wishlists/types';
import { DestinyInventoryItemDefinition, TierType } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import { partition } from 'es-toolkit';

interface Roll {
  /** rampage, outlaw, etc. */
  primaryPerksList: number[];
  /** fast access to primaryPerks keys */
  primarySocketIndices: number[];
  /** string to quickly measure primaryPerks equality */
  primaryPerkIdentifier: string;
  /** string to quickly measure primaryPerks equality, where rampage and enhanced rampage are the same perk */
  primaryPerkIdentifierNormalized: string;

  /** barrels, magazines, etc. object keyed by socket hash */
  secondaryPerksMap: Record<number, number>;
  /** fast access to secondaryPerks keys */
  secondarySocketIndices: number[];
  /** string to quickly measure secondaryPerks equality */
  secondaryPerkIdentifier: string;
}

export function consolidateRollsForOneWeapon(
  defs: D2ManifestDefinitions,
  item: DimItem,
  rolls: WishListRoll[],
) {
  const socketIndexByPerkHash: Record<number, number> = {};
  if (item.sockets) {
    for (const s of item.sockets.allSockets) {
      if (s.isReusable) {
        for (const p of s.plugOptions) {
          socketIndexByPerkHash[p.plugDef.hash] = s.socketIndex;
        }
      }
    }
  }

  const allRolls: Roll[] = rolls.map((roll) => {
    const [primaryPerksList, secondaryPerksList] = partition(
      Array.from(roll.recommendedPerks),
      (h) => isMajorPerk(defs.InventoryItem.get(h)),
    );

    // important sorting to generate comparably join()ed strings
    primaryPerksList.sort((a, b) => socketIndexByPerkHash[a] - socketIndexByPerkHash[b]);
    const primarySocketIndices = primaryPerksList.map((h) => socketIndexByPerkHash[h]);

    const secondaryPerksMap: Record<number, number> = {};
    for (const h of secondaryPerksList) {
      secondaryPerksMap[socketIndexByPerkHash[h]] = h;
    }

    // important sorting to generate comparably join()ed strings
    secondaryPerksList.sort((a, b) => socketIndexByPerkHash[a] - socketIndexByPerkHash[b]);
    const secondarySocketIndices = secondaryPerksList.map((h) => socketIndexByPerkHash[h]);

    return {
      primaryPerksList,
      primarySocketIndices,
      primaryPerkIdentifier: primaryPerksList.join(),
      primaryPerkIdentifierNormalized: primaryPerksList.map(normalizePerkKey).join(),
      secondaryPerksMap,
      secondarySocketIndices,
      secondaryPerkIdentifier: secondaryPerksList.join(),
    };
  });

  const rollsGroupedByPrimaryNormalizedPerks = Object.groupBy(
    allRolls,
    (roll) => roll.primaryPerkIdentifierNormalized,
  );

  const rollsGroupedByPrimaryPerks: Record<
    string,
    {
      commonPrimaryPerks: number[];
      rolls: Roll[];
    }
  > = {};

  for (const normalizedPrimaryPerkKey in rollsGroupedByPrimaryNormalizedPerks) {
    // within these braces, we're only looking at a situation like rampage/outlaw,
    // and its enhanced permutations. so we can make some assumptions
    const rollGroup = rollsGroupedByPrimaryNormalizedPerks[normalizedPrimaryPerkKey];

    if (!normalizedPrimaryPerkKey.includes('/')) {
      // this roll group is normal
      (rollsGroupedByPrimaryPerks[normalizedPrimaryPerkKey] ??= {
        commonPrimaryPerks: rollGroup[0].primaryPerksList,
        rolls: [],
      }).rolls.push(...rollGroup);
    } else {
      // this group needs enhancedness grouping
      // these rolls can be clumped into groups that have the same secondary perks
      const rollsGroupedBySecondaryStuff = Object.groupBy(
        rollGroup,
        (r) => r.secondaryPerkIdentifier,
      );
      for (const secondaryPerkKey in rollsGroupedBySecondaryStuff) {
        const rollsWithSameSecondaryPerks = rollsGroupedBySecondaryStuff[secondaryPerkKey];

        const commonPrimaryPerks = [
          ...new Set(rollsWithSameSecondaryPerks.flatMap((r) => r.primaryPerksList)),
        ].sort(compareBy((h) => socketIndexByPerkHash[h]));

        const commonPrimaryPerksKey = commonPrimaryPerks.join();
        if (
          rollsWithSameSecondaryPerks.length === 1 ||
          // if there's 2 rolls, if they have something in common,
          // i.e. "base/enh" and "base/base" have a "base" in the same column
          // it's safe to combine,
          (rollsWithSameSecondaryPerks.length === 2 &&
            rollsWithSameSecondaryPerks[0].primaryPerksList.some(
              (h, i) => h === rollsWithSameSecondaryPerks[1].primaryPerksList[i],
            )) ||
          // if there's 4 separate rolls, this is a full permutation of base/base, base/enh, enh/base, enh/enh
          rollsWithSameSecondaryPerks.length === 4
        ) {
          const rollGroup = (rollsGroupedByPrimaryPerks[commonPrimaryPerksKey] ??= {
            commonPrimaryPerks,
            rolls: [],
          });

          rollGroup.rolls.push(...rollsWithSameSecondaryPerks);
        }

        // otherwise, this is a unique set of rows. deliver them as-is, keyed by their non-grouped perks
        else {
          const theseRollsGroupedByPrimaryPerks = Object.groupBy(
            allRolls,
            (roll) => roll.primaryPerkIdentifier,
          );
          for (const primaryPerkKey in theseRollsGroupedByPrimaryPerks) {
            const rollsWithSamePrimaryPerks = theseRollsGroupedByPrimaryPerks[primaryPerkKey];
            (rollsGroupedByPrimaryPerks[primaryPerkKey] ??= {
              commonPrimaryPerks: rollsWithSamePrimaryPerks[0].primaryPerksList,
              rolls: [],
            }).rolls.push(...rollsWithSamePrimaryPerks);
          }
        }
      }
    }
  }

  // Because a base perk in the wish list matches an enhanced perk on the weapon,
  // add enhanced perks to the wish list rolls if the weapon can have them and the
  // roll doesn't specify them
  for (const roll of Object.values(rollsGroupedByPrimaryPerks)) {
    for (const perk of roll.commonPrimaryPerks) {
      const enhancedPerk = enhancedVersion(perk);
      if (enhancedPerk && !roll.commonPrimaryPerks.includes(enhancedPerk)) {
        const socketIndex = socketIndexByPerkHash[perk];
        if (
          socketIndex !== undefined &&
          item.sockets?.allSockets.some(
            (s) =>
              s.socketIndex === socketIndex &&
              s.plugOptions.some((p) => p.plugDef.hash === enhancedPerk),
          )
        ) {
          roll.commonPrimaryPerks.push(enhancedPerk);
        }
      }
    }
  }

  return Object.values(rollsGroupedByPrimaryPerks);
}

function isMajorPerk(item?: DestinyInventoryItemDefinition) {
  return Boolean(
    item &&
    (item.inventory!.tierType === TierType.Common ||
      item.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsFrame) ||
      item.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsIntrinsic)),
  );
}

// input
// [
//   [drop mag, smallbore],
//   [drop mag, extended barrel],
//   [tac mag, rifled barrel],
//   [tac mag, extended barrel]
// ]
// return
// [
//   [[drop mag], [smallbore, extended barrel]],
//   [[tac mag], [rifled barrel, extended barrel]]
// ]
export function consolidateSecondaryPerks(initialRolls: Roll[]) {
  // these are legit socketIndices according the item def. this might be like, [3, 4]
  const allSecondarySocketIndices = Array.from(
    new Set(initialRolls.flatMap((r) => r.secondarySocketIndices)),
  ).sort((a, b) => a - b);

  // newClusteredRolls collapses perks into an array with no blank spaces,
  // so we'll use this to iterate our new structure.
  // if above is [3, 4], this would be [0, 1]. basically array.keys
  const rollIndices = allSecondarySocketIndices.map((_, i) => i);

  let newClusteredRolls = initialRolls
    // ignore rolls with no secondary perks in them
    .filter((r) => r.secondarySocketIndices.length)
    .map((r) =>
      allSecondarySocketIndices.map((i) => {
        const perkHash = r.secondaryPerksMap[i];
        return perkHash ? { perks: [perkHash], key: `${perkHash}` } : { perks: [], key: `` };
      }),
    );

  // we iterate through the perk columns, looking for stuff to collapse
  for (const index of rollIndices) {
    // we repeatedly look for things to collapse until there are none

    while (true) {
      // find a bundle that matches another bundle, in every column except our current one
      const perkBundleToConsolidate = newClusteredRolls.find((r1) =>
        newClusteredRolls.some(
          (r2) => r1 !== r2 && rollIndices.every((i) => i === index || r1[i].key === r2[i].key),
        ),
      );
      // if nothing's found, we've collapsed as much as we can
      if (!perkBundleToConsolidate) {
        break;
      }

      const [bundlesToCombine, bundlesToLeaveAlone] = partition(newClusteredRolls, (r) =>
        rollIndices.every((i) => i === index || perkBundleToConsolidate[i].key === r[i].key),
      );

      // set aside the uninvolved bundles
      newClusteredRolls = bundlesToLeaveAlone;

      // build a new bundle with the same other columns, but add together the perks in this column
      const newPerkBundle = perkBundleToConsolidate.with(
        index,
        combineColumns(bundlesToCombine.map((b) => b[index])),
      );

      newClusteredRolls.push(newPerkBundle);
    }
  }
  return newClusteredRolls.map((c) => c.map((r) => r.perks));
}

interface PerkMeta {
  hash: number;
  type: 'curated' | 'both' | 'rolled';
}
export type PerkColumnsMeta = PerkMeta[][];

function getBaseEnhancedPerkPair(perkHash: number) {
  let base = unenhancedVersion(perkHash);
  let enhanced = enhancedVersion(perkHash);
  if (!base && !enhanced) {
    return;
  }

  if (!enhanced) {
    enhanced = enhancedVersion(base!)!;
  }
  if (!base) {
    base = unenhancedVersion(enhanced)!;
  }

  return { base, enhanced };
}

// given an enhanceable/enhanced perk, returns a key referring to both.
// given anything else, returns just a stringified hash
function normalizePerkKey(perkHash: number) {
  const bep = getBaseEnhancedPerkPair(perkHash);
  return bep ? `${bep.base}/${bep.enhanced}` : `${perkHash}`;
}

function combineColumns(
  columns: {
    perks: number[];
    key: string;
  }[],
) {
  const perks = [...new Set(columns.flatMap((c) => c.perks))].sort();

  return {
    perks,
    key: perks.join(),
  };
}
