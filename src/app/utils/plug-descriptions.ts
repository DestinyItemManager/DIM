import { Perk } from 'app/clarity/descriptions/descriptionInterface';
import { clarityDescriptionsSelector } from 'app/clarity/selectors';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { settingSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { DimItem, DimPlug, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { getStatSortOrder, isAllowedItemStat, isAllowedPlugStat } from 'app/inventory/store/stats';
import { activityModPlugCategoryHashes } from 'app/loadout/known-values';
import { isModStatActive } from 'app/loadout/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyClass, ItemPerkVisibility } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes, StatHashes, TraitHashes } from 'data/d2/generated-enums';
import perkToEnhanced from 'data/d2/trait-to-enhanced-trait.json';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import modsWithoutDescription from '../../data/d2/mods-with-bad-descriptions.json';
import { compareBy } from './comparators';
import { isPlugStatActive } from './item-utils';
import { LookupTable } from './util-types';

interface DimPlugPerkDescription {
  perkHash: number;
  hash: number;
  name?: string;
  description?: string;
  requirement?: string;
}

interface DimPlugDescriptions {
  perks: DimPlugPerkDescription[];
  communityInsight: Perk | undefined;
}

// some stats are often referred to using different names
// TODO: these need to be localized?
const statNameAliases: LookupTable<StatHashes, string[]> = {
  [StatHashes.AimAssistance]: ['Aim Assist'],
  [StatHashes.AmmoCapacity]: ['Magazine Stat'],
  [StatHashes.ReloadSpeed]: ['Reload'],
};

const enhancedPerkToRegularPerk = _.mapValues(_.invert(perkToEnhanced), Number);

export function usePlugDescriptions(
  plug?: PluggableInventoryItemDefinition,
  stats?: {
    value: number;
    statHash: number;
  }[],
  /**
   * If set, returns Bungie descriptions even when the descriptions setting is on Community only.
   * Consumers set this if they can't display community descriptions.
   */
  forceUseBungieDescriptions?: boolean,
): DimPlugDescriptions {
  const defs = useD2Definitions();
  const allClarityDescriptions = useSelector(clarityDescriptionsSelector);
  let descriptionsToDisplay = useSelector(settingSelector('descriptionsToDisplay'));
  if (forceUseBungieDescriptions) {
    descriptionsToDisplay = 'bungie';
  }

  const result: DimPlugDescriptions = {
    perks: [],
    communityInsight: undefined,
  };

  if (!plug || !defs) {
    return result;
  }

  const showBungieDescription =
    !$featureFlags.clarityDescriptions || descriptionsToDisplay !== 'community';
  const showCommunityDescription =
    $featureFlags.clarityDescriptions && descriptionsToDisplay !== 'bungie';
  const showCommunityDescriptionOnly =
    $featureFlags.clarityDescriptions && descriptionsToDisplay === 'community';

  // within this plug, let's not repeat any strings
  const statStrings = new Set<string>();

  if (stats) {
    // preload the used string tracker with common text representations of stat modifications
    for (const stat of stats) {
      const statDef = defs.Stat.get(stat.statHash);
      if (statDef) {
        const statNames = [statDef.displayProperties.name].concat(
          statNameAliases[stat.statHash as StatHashes] ?? [],
        );
        for (const statName of statNames) {
          if (stat.value < 0) {
            statStrings.add(`${stat.value} ${statName}`);
            statStrings.add(`${stat.value} ${statName} ▼`);
          } else {
            statStrings.add(`+${stat.value} ${statName}`);
            statStrings.add(`+${stat.value} ${statName} ▲`);
            statStrings.add(`Grants ${stat.value} ${statName}`);
          }
        }
      }
    }
  }

  const statAndBungieDescStrings = new Set<string>(statStrings);
  const perks = getPerkDescriptions(plug, defs, statAndBungieDescStrings);

  if (showCommunityDescription && allClarityDescriptions) {
    let clarityPerk = allClarityDescriptions[plug.hash];

    // if we couldn't find a Clarity description for this perk, fall back to the non-enhanced perk variant
    if (!clarityPerk) {
      const regularPerkHash = enhancedPerkToRegularPerk[plug.hash];
      if (regularPerkHash) {
        clarityPerk = allClarityDescriptions[regularPerkHash];
      }
    }
    if (clarityPerk) {
      result.communityInsight = clarityPerk;
    }
  }

  // if we don't have a community description, fall back to the Bungie description (if we aren't already
  // displaying it)
  if (showBungieDescription || (showCommunityDescriptionOnly && !result.communityInsight)) {
    result.perks.push(...perks);
  }

  return result;
}

function getPerkDescriptions(
  plug: PluggableInventoryItemDefinition,
  defs: D2ManifestDefinitions,
  usedStrings: Set<string>,
): DimPlugPerkDescription[] {
  const results: DimPlugPerkDescription[] = [];

  const plugDescription = plug.displayProperties.description || undefined;

  function addPerkDescriptions() {
    // filter out things with no displayable text, or that are meant to be hidden
    for (const perk of plug.perks) {
      if (perk.perkVisibility === ItemPerkVisibility.Hidden) {
        continue;
      }

      const sandboxPerk = defs.SandboxPerk.get(perk.perkHash);
      const perkName = sandboxPerk.displayProperties.name;

      let perkDescription = sandboxPerk.displayProperties.description || undefined;
      if (perkDescription) {
        if (usedStrings.has(perkDescription)) {
          perkDescription = undefined;
        } else {
          usedStrings.add(perkDescription);
          results.push({
            perkHash: perk.perkHash,
            hash: plug.hash,
            name: perkName && perkName !== plug.displayProperties.name ? perkName : undefined,
            description: perkDescription,
          });
        }
      }

      // Some perks are only active in certain activities (see Garden of Salvation raid mods)
      let perkRequirement = perk.requirementDisplayString || undefined;
      if (perkRequirement) {
        if (usedStrings.has(perkRequirement)) {
          perkRequirement = undefined;
        } else {
          usedStrings.add(perkRequirement);
        }
        results.push({
          perkHash: -results.length,
          hash: plug.hash,
          name: perkName && perkName !== plug.displayProperties.name ? perkName : undefined,
          requirement: perkRequirement,
        });
      }
    }
  }
  function addDescriptionAsRequirement() {
    if (plugDescription && !usedStrings.has(plugDescription)) {
      results.push({
        perkHash: -usedStrings.size,
        hash: plug.hash,
        requirement: plugDescription,
      });
      usedStrings.add(plugDescription);
    }
  }
  function addDescriptionAsFunctionality() {
    if (plugDescription && !usedStrings.has(plugDescription)) {
      results.push({
        perkHash: -usedStrings.size,
        hash: plug.hash,
        description: plugDescription,
      });
      usedStrings.add(plugDescription);
    }
  }
  function addTooltipNotifsAsRequirement() {
    const notifs = plug.tooltipNotifications
      .map((notif) => notif.displayString)
      .filter((str) => !usedStrings.has(str));
    for (const notif of notifs) {
      results.push({
        perkHash: -usedStrings.size,
        hash: plug.hash,
        requirement: notif,
      });
      usedStrings.add(notif);
    }
  }
  function addCustomDescriptionAsFunctionality() {
    for (const mod of modsWithoutDescription.Harmonic) {
      if (plug.hash === mod) {
        results.push({
          perkHash: -usedStrings.size,
          hash: plug.hash,
          description: t('Mods.HarmonicModDescription'),
        });
        usedStrings.add(t('Mods.HarmonicModDescription'));
      }
    }
  }

  /*
  Most plugs use the description field to describe their functionality.

  Some plugs (e.g. armor mods) store their functionality in their perk descriptions and use the description
  field for auxiliary info like requirements and caveats. For these plugs, we want to prioritize strings in the
  perks and only fall back to the actual description if we don't have any perks.

  Other plugs (e.g. Exotic catalysts) always use the description field to store their requirements.
  */
  if (plug.traitHashes?.includes(TraitHashes.ItemExoticCatalyst)) {
    addPerkDescriptions();
    addDescriptionAsRequirement();
  } else if (plug.itemCategoryHashes?.includes(ItemCategoryHashes.ArmorMods)) {
    addPerkDescriptions();

    // if we already have some displayable perks, this means the description is basically
    // a "requirements" string like "This mod's perks are only active" etc. (see Deep Stone Crypt raid mods)
    if (results.length > 0 && activityModPlugCategoryHashes.includes(plug.plug.plugCategoryHash)) {
      addDescriptionAsRequirement();
    } else {
      addDescriptionAsFunctionality();
    }
  } else if (plugDescription) {
    addDescriptionAsFunctionality();
  } else {
    addPerkDescriptions();
  }

  // Add custom descriptions created for mods who's description is hard to access or an accurate description isn't present
  addCustomDescriptionAsFunctionality();

  // a fallback: if we still don't have any perk descriptions, at least keep the first perk for display.
  // there are mods like this (e.g. Elemental Armaments): no description, and annoyingly all perks are set
  // to ItemPerkVisibility.Hidden
  if (!results.length && plug.perks.length) {
    const firstPerk = plug.perks[0];
    const sandboxPerk = defs.SandboxPerk.get(firstPerk.perkHash);
    const perkName = sandboxPerk.displayProperties.name;
    const perkDesc: DimPlugPerkDescription = {
      perkHash: firstPerk.perkHash,
      hash: plug.hash,
      name: perkName && perkName !== plug.displayProperties.name ? perkName : undefined,
    };

    if (
      sandboxPerk.displayProperties.description &&
      !usedStrings.has(sandboxPerk.displayProperties.description)
    ) {
      perkDesc.description = sandboxPerk.displayProperties.description;
      usedStrings.add(sandboxPerk.displayProperties.description);
    }
    if (
      firstPerk.requirementDisplayString &&
      !usedStrings.has(firstPerk.requirementDisplayString)
    ) {
      perkDesc.requirement = firstPerk.requirementDisplayString;
      usedStrings.add(firstPerk.requirementDisplayString);
    }

    if (perkDesc.description || perkDesc.requirement) {
      results.push(perkDesc);
    }
  }

  // Needs to be last added otherwise we can break the above statement causing a description to not be added
  if (plug.itemCategoryHashes?.includes(ItemCategoryHashes.ArmorMods)) {
    addTooltipNotifsAsRequirement();
  }

  return results;
}

export function getPlugDefStats(
  plugDef: PluggableInventoryItemDefinition,
  classType: DestinyClass | undefined,
) {
  return plugDef.investmentStats
    .filter(
      (stat) =>
        (isAllowedItemStat(stat.statTypeHash) || isAllowedPlugStat(stat.statTypeHash)) &&
        (classType === undefined || isModStatActive(classType, plugDef.hash, stat)),
    )
    .map((stat) => ({
      statHash: stat.statTypeHash,
      value: stat.value,
    }))
    .sort(compareBy((stat) => getStatSortOrder(stat.statHash)));
}

export function getDimPlugStats(item: DimItem, plug: DimPlug) {
  if (plug.stats) {
    return Object.entries(plug.stats)
      .map(([statHash, value]) => ({
        statHash: parseInt(statHash, 10),
        value,
      }))
      .filter(
        (stat) =>
          // Item stats are only shown if the item can actually benefit from them
          ((isAllowedItemStat(stat.statHash) &&
            item.stats?.some((itemStat) => itemStat.statHash === stat.statHash)) ||
            isAllowedPlugStat(stat.statHash)) &&
          isPlugStatActive(
            item,
            plug.plugDef,
            stat.statHash,
            Boolean(
              plug.plugDef.investmentStats.find((s) => s.statTypeHash === stat.statHash)
                ?.isConditionallyActive,
            ),
          ),
      )
      .sort(compareBy((stat) => getStatSortOrder(stat.statHash)));
  }
}
