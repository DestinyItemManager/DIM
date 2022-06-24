import { Perk } from 'app/clarity/descriptions/descriptionInterface';
import { clarityDescriptionsSelector } from 'app/clarity/selectors';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { settingSelector } from 'app/dim-api/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { EXOTIC_CATALYST_TRAIT, modsWithConditionalStats } from 'app/search/d2-known-values';
import { DestinyInventoryItemDefinition, ItemPerkVisibility } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
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

export function usePlugDescriptions(plug?: DestinyInventoryItemDefinition): DimPlugDescriptions {
  const defs = useD2Definitions();
  const allClarityDescriptions = useSelector(clarityDescriptionsSelector);
  const descriptionsToDisplay = useSelector(settingSelector('descriptionsToDisplay'));

  if (!plug) {
    return {
      perks: [],
      communityInsight: undefined,
    };
  }
  const clarityPerk = allClarityDescriptions?.[plug.hash];
  const communityInsight =
    clarityPerk && !clarityPerk.statOnly && clarityPerk.simpleDescription ? clarityPerk : undefined;

  const showBungieDescription =
    !$featureFlags.clarityDescriptions || descriptionsToDisplay !== 'community';
  const showCommunityDescription =
    $featureFlags.clarityDescriptions && descriptionsToDisplay !== 'bungie';
  const showCommunityDescriptionOnly =
    $featureFlags.clarityDescriptions && descriptionsToDisplay === 'community';

  return {
    perks:
      showBungieDescription || (showCommunityDescriptionOnly && !communityInsight)
        ? (defs && getPerkDescriptions(plug, defs)) || []
        : [],
    communityInsight: showCommunityDescription ? communityInsight : undefined,
  };
}

function getPerkDescriptions(
  plug: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions
): DimPlugPerkDescription[] {
  const results: DimPlugPerkDescription[] = [];

  // within this plug, let's not repeat any descriptions or requirement strings
  const uniqueStrings = new Set<string>();
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
        if (uniqueStrings.has(perkDescription)) {
          perkDescription = undefined;
        } else {
          uniqueStrings.add(perkDescription);
        }
      }

      // Some perks are only active in certain activities (see Garden of Salvation raid mods)
      let perkRequirement = perk.requirementDisplayString || undefined;
      if (perkRequirement) {
        if (uniqueStrings.has(perkRequirement)) {
          perkRequirement = undefined;
        } else {
          uniqueStrings.add(perkRequirement);
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
    if (plugDescription && !uniqueStrings.has(plugDescription)) {
      results.push({
        perkHash: 0,
        requirement: plugDescription,
      });
    }
  }
  function addDescriptionAsFunctionality() {
    if (plugDescription && !uniqueStrings.has(plugDescription)) {
      results.push({
        perkHash: 0,
        description: plugDescription,
      });
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
    results.push({
      perkHash: firstPerk.perkHash,
      name: perkName && perkName !== plug.displayProperties.name ? perkName : undefined,
      description: sandboxPerk.displayProperties.description,
      requirement: firstPerk.requirementDisplayString,
    });
  }

  return results;
}
