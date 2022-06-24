import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { EXOTIC_CATALYST_TRAIT, modsWithConditionalStats } from 'app/search/d2-known-values';
import { DestinyInventoryItemDefinition, ItemPerkVisibility } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';

interface DimPlugPerkDescription {
  perkHash: number;
  name?: string;
  description?: string;
  requirement?: string;
}

interface DimPlugDescriptions {
  perks: DimPlugPerkDescription[];
}

export function getPlugDescriptions(
  plug: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions
): DimPlugDescriptions {
  const result: DimPlugDescriptions = {
    perks: [],
  };

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
        result.perks.push({
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
      result.perks.push({
        perkHash: 0,
        requirement: plugDescription,
      });
    }
  }
  function addDescriptionAsFunctionality() {
    if (plugDescription && !uniqueStrings.has(plugDescription)) {
      result.perks.push({
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
    if (result.perks.length > 0) {
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
  if (!result.perks.length && plug.perks.length) {
    const firstPerk = plug.perks[0];
    const sandboxPerk = defs.SandboxPerk.get(firstPerk.perkHash);
    const perkName = sandboxPerk.displayProperties.name;
    result.perks.push({
      perkHash: firstPerk.perkHash,
      name: perkName && perkName !== plug.displayProperties.name ? perkName : undefined,
      description: sandboxPerk.displayProperties.description,
      requirement: firstPerk.requirementDisplayString,
    });
  }

  return result;
}
