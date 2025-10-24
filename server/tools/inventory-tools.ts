/**
 * Inventory search tools for MCP
 *
 * Uses direct Bungie API calls from Node.js with authentication
 * provided by the browser DIM instance via token sync.
 *
 * Now uses DIM's real filter factory with simplified DimItem objects.
 */

import {
  DestinyClass,
  DestinyComponentType,
  DestinyItemType,
  TierType,
  getDestinyManifest,
  getLinkedProfiles,
  getProfile,
} from 'bungie-api-ts/destiny2';
import { createAuthenticatedBungieClient } from '../auth/http-client';
import type { MCPToolResponse, SearchInventoryArgs } from '../types/mcp-tools';

/**
 * Simple query filter - parses and applies filters to items
 * Supports: name, is:exotic/legendary, type:weapon/armor, is:vault/equipped, stat comparisons, perks
 */
function parseAndFilterQuery(items: any[], query: string): any[] {
  if (!query || query === '*') {
    return items;
  }

  const queryLower = query.toLowerCase();
  const terms = queryLower.match(/(?:[^\s"]|"[^"]*")+/g) || [];

  return items.filter((item) =>
    terms.every((term) => {
      // Name search (quoted or unquoted)
      if (term.startsWith('"') && term.endsWith('"')) {
        const searchName = term.slice(1, -1);
        return item.name?.toLowerCase().includes(searchName);
      }

      // Handle key:value filters
      if (term.includes(':')) {
        const [key, value] = term.split(':', 2);

        switch (key) {
          case 'name':
            return item.name?.toLowerCase().includes(value.toLowerCase());

          case 'is':
            if (value === 'exotic' || value === 'legendary' || value === 'rare') {
              return item.tierType?.toLowerCase() === value;
            }
            if (value === 'weapon') {
              return item.itemType === 'Weapon';
            }
            if (value === 'armor') {
              return item.itemType === 'Armor';
            }
            if (value === 'vault') {
              return item.location === 'vault';
            }
            if (value === 'equipped') {
              return item.equipped === true;
            }
            if (value === 'titan' || value === 'hunter' || value === 'warlock') {
              return item.classType?.toLowerCase() === value;
            }
            return false;

          case 'type':
            if (value === 'weapon') {
              return item.itemType === 'Weapon';
            }
            if (value === 'armor') {
              return item.itemType === 'Armor';
            }
            return item.itemTypeDisplayName?.toLowerCase().includes(value);

          case 'perk': {
            const perkName = value.replace(/"/g, '');
            return item.perks?.some((p: any) => p.name?.toLowerCase().includes(perkName));
          }

          // Stat comparisons: stat:>50, stability:>=40, etc.
          default: {
            const statName = key;
            const match = value.match(/^([><=]+)(\d+)$/);
            if (match) {
              const [, operator, threshold] = match;
              const thresholdNum = parseInt(threshold, 10);
              const stat = item.stats?.find(
                (s: any) => s.name?.toLowerCase() === statName.toLowerCase(),
              );
              if (!stat) {return false;}

              switch (operator) {
                case '>':
                  return stat.value > thresholdNum;
                case '>=':
                  return stat.value >= thresholdNum;
                case '<':
                  return stat.value < thresholdNum;
                case '<=':
                  return stat.value <= thresholdNum;
                case '=':
                case '==':
                  return stat.value === thresholdNum;
                default:
                  return false;
              }
            }
            return false;
          }
        }
      }

      // Plain text search in name
      return item.name?.toLowerCase().includes(term);
    }),
  );
}

// Enum to string mappings
const classTypeToString = (classType: number): string => {
  const classMap: Record<number, string> = {
    [DestinyClass.Titan]: 'Titan',
    [DestinyClass.Hunter]: 'Hunter',
    [DestinyClass.Warlock]: 'Warlock',
    [DestinyClass.Unknown]: 'Any',
  };
  return classMap[classType] || `Unknown(${classType})`;
};

const tierTypeToString = (tierType: number): string => {
  const tierMap: Record<number, string> = {
    [TierType.Unknown]: 'Unknown',
    [TierType.Currency]: 'Currency',
    [TierType.Basic]: 'Basic',
    [TierType.Common]: 'Common',
    [TierType.Rare]: 'Rare',
    [TierType.Superior]: 'Legendary',
    [TierType.Exotic]: 'Exotic',
  };
  return tierMap[tierType] || `Unknown(${tierType})`;
};

/**
 * Search inventory - returns raw Bungie API data with item definitions
 *
 * This returns the raw DestinyItemComponent objects from the Bungie API
 * along with their definitions for easy lookup.
 */
export async function searchInventory(args: SearchInventoryArgs): Promise<MCPToolResponse> {
  const { query } = args;

  try {
    // Create authenticated client (throws if auth not set up)
    const { httpClient, membershipId } = await createAuthenticatedBungieClient();

    console.log('[MCP] Fetching inventory for Bungie.net membership:', membershipId);

    // First, get linked Destiny profiles to find the actual Destiny membership ID
    console.log('[MCP] Fetching linked profiles...');
    const linkedProfiles = await getLinkedProfiles(httpClient, {
      membershipId,
      membershipType: 254, // BungieNext (Bungie.net)
      getAllMemberships: true,
    });

    if (
      !linkedProfiles?.Response?.profiles ||
      linkedProfiles.Response.profiles.length === 0
    ) {
      throw new Error('No Destiny profiles found for this Bungie.net account');
    }

    // Use the first Destiny profile (usually the primary one)
    const destinyProfile = linkedProfiles.Response.profiles[0];
    const destinyMembershipId = destinyProfile.membershipId;
    const membershipType = destinyProfile.membershipType;

    console.log(
      '[MCP] Found Destiny profile:',
      destinyMembershipId,
      'platform:',
      membershipType,
    );

    // Fetch the manifest to get item definitions
    console.log('[MCP] Fetching manifest...');
    const manifestResponse = await getDestinyManifest(httpClient);
    const contentPaths = manifestResponse.Response.jsonWorldComponentContentPaths.en;

    console.log('[MCP] Downloading definitions...');
    const [itemDefsResponse, statDefsResponse, sandboxPerkDefsResponse] = await Promise.all([
      fetch(`https://www.bungie.net${contentPaths.DestinyInventoryItemDefinition}`),
      fetch(`https://www.bungie.net${contentPaths.DestinyStatDefinition}`),
      fetch(`https://www.bungie.net${contentPaths.DestinySandboxPerkDefinition}`),
    ]);

    const [itemDefs, statDefs, sandboxPerkDefs] = await Promise.all([
      itemDefsResponse.json(),
      statDefsResponse.json(),
      sandboxPerkDefsResponse.json(),
    ]);

    // Fetch inventory from Bungie API - always fetch all component data
    console.log('[MCP] Fetching profile inventory...');
    const profileResponse = await getProfile(httpClient, {
      destinyMembershipId,
      membershipType,
      components: [
        DestinyComponentType.ProfileInventories,
        DestinyComponentType.CharacterInventories,
        DestinyComponentType.CharacterEquipment,
        DestinyComponentType.ItemInstances, // Instance data including armor stat rolls
        DestinyComponentType.ItemStats, // All item stats
        DestinyComponentType.ItemPerks, // Intrinsic perks
      ],
    });

    if (!profileResponse?.Response) {
      throw new Error('Failed to fetch profile from Bungie API');
    }

    // Collect all raw items from profile
    const profile = profileResponse.Response;
    const allItems: any[] = [];

    // Add vault items
    if (profile.profileInventory?.data?.items) {
      for (const item of profile.profileInventory.data.items) {
        allItems.push({
          ...item,
          location: 'vault',
          equipped: false,
        });
      }
    }

    // Add character items
    if (profile.characterInventories?.data) {
      for (const [characterId, inventory] of Object.entries(profile.characterInventories.data)) {
        for (const item of inventory.items) {
          allItems.push({
            ...item,
            location: 'character',
            characterId,
            equipped: false,
          });
        }
      }
    }

    // Add equipped items
    if (profile.characterEquipment?.data) {
      for (const [characterId, equipment] of Object.entries(profile.characterEquipment.data)) {
        for (const item of equipment.items) {
          allItems.push({
            ...item,
            location: 'character',
            characterId,
            equipped: true,
          });
        }
      }
    }

    console.log(`[MCP] Collected ${allItems.length} items from profile`);

    // Filter to only weapons and armor
    const weaponsAndArmor = allItems.filter((item) => {
      const itemDef = itemDefs[item.itemHash];
      return (
        itemDef?.itemType === DestinyItemType.Weapon ||
        itemDef?.itemType === DestinyItemType.Armor
      );
    });

    console.log(`[MCP] Filtered to ${weaponsAndArmor.length} weapons and armor`);

    // Enrich items with their definitions and instance data
    // Note: Weapons and armor are always instanced, so we can safely assume itemInstanceId exists
    const enrichedItems = weaponsAndArmor.map((item) => {
      const itemDef = itemDefs[item.itemHash];
      const statsData = profile.itemComponents?.stats?.data?.[item.itemInstanceId];
      const perksData = profile.itemComponents?.perks?.data?.[item.itemInstanceId];

      // Map stats with names - filter to only important stats
      const importantStats = [
        'Stability',
        'Handling',
        'Range',
        'Reload Speed',
        'Impact',
        'Magazine',
        'Rounds Per Minute',
        'Mobility',
        'Resilience',
        'Recovery',
        'Discipline',
        'Intellect',
        'Strength',
      ];

      // Get stats from investmentStats (like DIM does internally)
      // This is more reliable than the ItemStats component, especially for armor
      let enrichedStats: Array<{name: string; value: number}> = [];

      if (itemDef?.investmentStats) {
        // Use investment stats from item definition (this works for both weapons and armor)
        enrichedStats = itemDef.investmentStats
          .map((investmentStat: any) => {
            const statDef = statDefs[investmentStat.statTypeHash];
            const statName = statDef?.displayProperties?.name;
            return statName
              ? {
                  name: statName,
                  value: investmentStat.value,
                }
              : null;
          })
          .filter((stat: {name: string; value: number} | null): stat is {name: string; value: number} =>
            stat !== null && importantStats.includes(stat.name)
          );
      } else if (statsData?.stats) {
        // Fallback: try statsData component
        enrichedStats = Object.entries(statsData.stats)
          .map(([statHash, stat]: [string, any]) => {
            const statDef = statDefs[statHash];
            return {
              name: statDef?.displayProperties?.name || 'Unknown Stat',
              value: stat.value,
            };
          })
          .filter((stat) => importantStats.includes(stat.name));
      }

      // Map perks with names - filter out unknown perks
      const enrichedPerks = perksData?.perks
        ? perksData.perks
            .map((perk: any) => {
              const perkDef = sandboxPerkDefs[perk.perkHash];
              const name = perkDef?.displayProperties?.name;
              return name
                ? {
                    name,
                    isActive: perk.isActive,
                  }
                : null;
            })
            .filter((perk) => perk !== null)
        : [];

      // Only include classType if it's not "Any"
      const classType = itemDef ? classTypeToString(itemDef.classType) : 'Unknown';
      const classTypeField = classType !== 'Any' ? { classType } : {};

      return {
        // Essential item data
        itemInstanceId: item.itemInstanceId,
        location: item.location,
        characterId: item.characterId,
        equipped: item.equipped,

        // Item definition (flattened)
        name: itemDef?.displayProperties?.name,
        itemTypeDisplayName: itemDef?.itemTypeDisplayName,
        itemType:
          itemDef?.itemType === DestinyItemType.Weapon
            ? 'Weapon'
            : itemDef?.itemType === DestinyItemType.Armor
              ? 'Armor'
              : 'Other',
        tierType: itemDef ? tierTypeToString(itemDef.inventory?.tierType ?? 0) : 'Unknown',
        ...classTypeField,

        // Stats with names
        stats: enrichedStats,

        // Perks with names
        perks: enrichedPerks,
      };
    });

    // Apply query filter
    const filteredItems = parseAndFilterQuery(enrichedItems, query || '');
    console.log(`[MCP] Filtered to ${filteredItems.length} items matching query: "${query || '*'}"`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              items: filteredItems,
              totalCount: filteredItems.length,
              totalInventoryCount: enrichedItems.length,
              query: query || '*',
              _note:
                'Filtered inventory data. Supports queries like: name:Austringer, is:exotic, type:weapon, is:vault, stability:>50, perk:Rampage',
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    console.error('[MCP] Error in searchInventory:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'Search failed',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          }),
        },
      ],
    };
  }
}
