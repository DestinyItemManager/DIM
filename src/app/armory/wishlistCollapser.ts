import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { WishListRoll } from 'app/wishlists/types';
import { DestinyInventoryItemDefinition, TierType } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import perkToEnhanced from 'data/d2/trait-to-enhanced-trait.json';
import _ from 'lodash';

const enhancedToPerk = _.mapValues(_.invert(perkToEnhanced), Number);

type Roll = {
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
};

export function consolidateRollsForOneWeapon(
  defs: D2ManifestDefinitions,
  item: DimItem,
  rolls: WishListRoll[]
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
    const [primaryPerksList, secondaryPerksList] = _.partition(
      Array.from(roll.recommendedPerks),
      (h) => isMajorPerk(defs.InventoryItem.get(h))
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

  const rollsGroupedByPrimaryNormalizedPerks = _.groupBy(
    allRolls,
    (roll) => roll.primaryPerkIdentifierNormalized
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
      const rollsGroupedBySecondaryStuff = _.groupBy(rollGroup, (r) => r.secondaryPerkIdentifier);

      for (const secondaryPerkKey in rollsGroupedBySecondaryStuff) {
        const rollsWithSameSecondaryPerks = rollsGroupedBySecondaryStuff[secondaryPerkKey];

        const commonPrimaryPerks = _.sortBy(
          _.uniq(rollsWithSameSecondaryPerks.flatMap((r) => r.primaryPerksList)),
          (h) => socketIndexByPerkHash[h]
        );

        const commonPrimaryPerksKey = commonPrimaryPerks.join();

        if (
          // if there's 2 rolls, if they have something in common,
          // i.e. "base/enh" and "base/base" have a "base" in the same column
          // it's safe to combine,
          (rollsWithSameSecondaryPerks.length === 2 &&
            rollsWithSameSecondaryPerks[0].primaryPerksList.some(
              (h, i) => h === rollsWithSameSecondaryPerks[1].primaryPerksList[i]
            )) ||
          // if there's 4 separate rolls, this is a full permutation of base/base, base/enh, enh/base, enh/enh
          rollsWithSameSecondaryPerks.length === 4
        ) {
          (rollsGroupedByPrimaryPerks[commonPrimaryPerksKey] ??= {
            commonPrimaryPerks,
            rolls: [],
          }).rolls.push(...rollsWithSameSecondaryPerks);
        }

        // otherwise, this is a unique set of rows. deliver them as-is, keyed by their non-grouped perks
        else {
          const theseRollsGroupedByPrimaryPerks = _.groupBy(
            allRolls,
            (roll) => roll.primaryPerkIdentifier
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

  return Object.values(rollsGroupedByPrimaryPerks);
}

function isMajorPerk(item?: DestinyInventoryItemDefinition) {
  return (
    item &&
    (item.inventory!.tierType === TierType.Common ||
      item.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsFrame) ||
      item.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsIntrinsic))
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
  const allSecondaryIndices = _.uniq(initialRolls.flatMap((r) => r.secondarySocketIndices)).sort(
    (a, b) => a - b
  );

  let newClusteredRolls = initialRolls.map((r) =>
    allSecondaryIndices.map((i) => {
      const perkHash = r.secondaryPerksMap[i];
      return perkHash ? { perks: [perkHash], key: `${perkHash}` } : { perks: [], key: `` };
    })
  );
  // yes, this is an `in`
  for (const socketIndex in allSecondaryIndices) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const perkBundleToConsolidate = newClusteredRolls.find((r1) =>
        newClusteredRolls.some((r2) => r1 !== r2 && r1[socketIndex].key === r2[socketIndex].key)
      );
      if (!perkBundleToConsolidate) {
        break;
      }

      const [bundlesToCombine, bundlesToLeaveAlone] = _.partition(
        newClusteredRolls,
        (r) => r[socketIndex].key === perkBundleToConsolidate[socketIndex].key
      );

      newClusteredRolls = bundlesToLeaveAlone;
      const newPerkBundle = Array.from(perkBundleToConsolidate);
      for (const i in newPerkBundle) {
        if (i === socketIndex) {
          continue;
        }

        newPerkBundle[i] = combineColumns(bundlesToCombine.map((b) => b[i]));
      }

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
  let base: number = enhancedToPerk[perkHash];
  let enhanced: number = perkToEnhanced[perkHash];
  if (!base && !enhanced) {
    return;
  }

  if (!enhanced) {
    enhanced = perkToEnhanced[base]!;
  }
  if (!base) {
    base = enhancedToPerk[enhanced];
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
  }[]
) {
  const perks = _.uniq(columns.flatMap((c) => c.perks)).sort();

  return {
    perks,
    key: perks.join(),
  };
}
