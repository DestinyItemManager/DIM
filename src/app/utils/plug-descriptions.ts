import { Perk } from 'app/clarity/descriptions/descriptionInterface';
import { clarityDescriptionsSelector } from 'app/clarity/selectors';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { settingSelector } from 'app/dim-api/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { EXOTIC_CATALYST_TRAIT, modsWithConditionalStats } from 'app/search/d2-known-values';
import { DestinyInventoryItemDefinition, ItemPerkVisibility } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import perkToEnhanced from 'data/d2/trait-to-enhanced-trait.json';
import _ from 'lodash';
import { useSelector } from 'react-redux';

interface DimPlugPerkDescription {
  perkHash: number;
  name?: string;
  description?: string;
  requirement?: string;
}

interface DimPlugDescriptions {
  perks: DimPlugPerkDescription[];
  communityInsight: Perk | undefined;
}

// some stats are often referred to using different names
const statNameAliases = {
  [StatHashes.AimAssistance]: ['Aim Assist'],
  [StatHashes.AmmoCapacity]: ['Magazine Stat'],
  [StatHashes.ReloadSpeed]: ['Reload'],
};

export const enhancedPerkToRegularPerk = _.mapValues(_.invert(perkToEnhanced), Number);

export function usePlugDescriptions(
  plug?: DestinyInventoryItemDefinition,
  stats?: {
    value: number;
    statHash: number;
  }[]
): DimPlugDescriptions {
  const defs = useD2Definitions();
  const allClarityDescriptions = useSelector(clarityDescriptionsSelector);
  const descriptionsToDisplay = useSelector(settingSelector('descriptionsToDisplay'));

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
  const usedStrings = new Set<string>();

  if (stats) {
    // preload the used string tracker with common text representations of stat modifications
    for (const stat of stats) {
      const statDef = defs.Stat.get(stat.statHash);
      if (statDef) {
        const statNames = [statDef.displayProperties.name].concat(statNameAliases[stat.statHash]);
        for (const statName of statNames) {
          if (stat.value < 0) {
            usedStrings.add(`${stat.value} ${statName}`);
            usedStrings.add(`${stat.value} ${statName} ▼`);
          } else {
            usedStrings.add(`+${stat.value} ${statName}`);
            usedStrings.add(`+${stat.value} ${statName} ▲`);
            usedStrings.add(`Grants ${stat.value} ${statName}`);
          }
        }
      }
    }
  }

  const perks = getPerkDescriptions(plug, defs, usedStrings);

  if (showCommunityDescription && allClarityDescriptions) {
    let clarityPerk = allClarityDescriptions[plug.hash];

    // if we couldn't find a Clarity description for this perk, fall back to the non-enhanced perk variant
    if (!clarityPerk) {
      const regularPerkHash = enhancedPerkToRegularPerk[plug.hash];
      if (regularPerkHash) {
        clarityPerk = allClarityDescriptions[regularPerkHash];
      }
    }

    if (clarityPerk && !clarityPerk.statOnly) {
      // strip out any strings that are used in the Bungie description
      const communityInsightWithoutDupes = stripUsedStrings(clarityPerk, usedStrings);
      if (communityInsightWithoutDupes) {
        // if our stripped community description is truthy, we know it contains at least 1 unique string
        // we only want to display the stripped community description if we're also showing the Bungie description
        result.communityInsight = showBungieDescription
          ? communityInsightWithoutDupes
          : clarityPerk;
      }
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
  plug: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions,
  usedStrings: Set<string>
): DimPlugPerkDescription[] {
  const results: DimPlugPerkDescription[] = [];

  const plugDescription = plug.displayProperties.description || undefined;

  function addPerkDescriptions() {
    // Terrible hack here: Echo of Persistence behaves like Charge Harvester, but uses a number of hidden perks
    // (which we can't associate with stats), But we also can't get the relevant classType in here,
    // so just copy the "-10 to the stat that governs your class ability recharge rate" perk from Charge Harvester.
    const perks = [...plug.perks];
    if (plug.hash === modsWithConditionalStats.echoOfPersistence) {
      const chargeHarvesterDef = defs.InventoryItem.get(modsWithConditionalStats.chargeHarvester);
      perks.push(chargeHarvesterDef.perks[1]);
    }

    // filter out things with no displayable text, or that are meant to be hidden
    for (const perk of perks) {
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
      }

      if (perkDescription || perkRequirement) {
        results.push({
          perkHash: perk.perkHash,
          name: perkName && perkName !== plug.displayProperties.name ? perkName : undefined,
          description: perkDescription,
          requirement: perkRequirement,
        });
      }
    }
  }
  function addDescriptionAsRequirement() {
    if (plugDescription && !usedStrings.has(plugDescription)) {
      results.push({
        perkHash: 0,
        requirement: plugDescription,
      });
      usedStrings.add(plugDescription);
    }
  }
  function addDescriptionAsFunctionality() {
    if (plugDescription && !usedStrings.has(plugDescription)) {
      results.push({
        perkHash: 0,
        description: plugDescription,
      });
      usedStrings.add(plugDescription);
    }
  }

  /*
  Most plugs use the description field to describe their functionality.

  Some plugs (e.g. armor mods) store their functionality in their perk descriptions and use the description
  field for auxiliary info like requirements and caveats. For these plugs, we want to prioritise strings in the
  perks and only fall back to the actual description if we don't have any perks.

  Other plugs (e.g. Exotic catalysts) always use the description field to store their requirements.
  */
  if (plug.traitHashes?.includes(EXOTIC_CATALYST_TRAIT)) {
    addPerkDescriptions();
    addDescriptionAsRequirement();
  } else if (plug.itemCategoryHashes?.includes(ItemCategoryHashes.ArmorMods)) {
    addPerkDescriptions();

    // if we already have some displayable perks, this means the description is basically
    // a "requirements" string like "This mod's perks are only active" etc. (see Deep Stone Crypt raid mods)
    if (results.length > 0) {
      addDescriptionAsRequirement();
    } else {
      addDescriptionAsFunctionality();
    }
  } else {
    if (plugDescription) {
      addDescriptionAsFunctionality();
    } else {
      addPerkDescriptions();
    }
  }

  // a fallback: if we still don't have any perk descriptions, at least keep the first perk for display.
  // there are mods like this (e.g. Elemental Armaments): no description, and annoyingly all perks are set
  // to ItemPerkVisibility.Hidden
  if (!results.length && plug.perks.length) {
    const firstPerk = plug.perks[0];
    const sandboxPerk = defs.SandboxPerk.get(firstPerk.perkHash);
    const perkName = sandboxPerk.displayProperties.name;
    const perkDesc: DimPlugPerkDescription = {
      perkHash: firstPerk.perkHash,
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

  return results;
}

function stripUsedStrings(
  communityInsight: Readonly<Perk>,
  usedStrings: ReadonlySet<string>
): Perk | undefined {
  if (!communityInsight.simpleDescription) {
    return;
  }

  // todo: only rebuild these arrays if they contain a duplicate line

  const simpleDescription = communityInsight.simpleDescription.map((line) =>
    line.lineText
      ? {
          ...line,
          lineText: line.lineText.filter(
            (content) => !content.text || !usedStrings.has(content.text)
          ),
        }
      : line
  );
  if (!simpleDescription.some((line) => line.lineText?.length)) {
    return;
  }

  return {
    ...communityInsight,
    simpleDescription,
  };
}
