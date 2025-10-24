/**
 * Item management tools for MCP (move, equip)
 *
 * ARCHITECTURE NOTE:
 * Item operations require direct Bungie API calls:
 * - POST /Destiny2/Actions/Items/TransferItem/ (move items)
 * - POST /Destiny2/Actions/Items/EquipItem/ (equip items)
 *
 * Implementation approach:
 * 1. Use bungie-api-ts types and endpoints
 * 2. Require OAuth tokens from auth manager
 * 3. Make direct API calls from Node.js
 * 4. Handle API errors and rate limits
 *
 * References:
 * - src/app/inventory/move-item.ts (browser implementation)
 * - https://bungie-net.github.io/multi/operation_post_Destiny2-Actions-Items-TransferItem.html
 */

import {
  DestinyComponentType,
  equipItem as bungieEquipItem,
  getLinkedProfiles,
  getProfile,
  transferItem,
} from 'bungie-api-ts/destiny2';
import { createAuthenticatedBungieClient } from '../auth/http-client';
import type {
  EquipItemArgs,
  EquipItemResult,
  MCPToolResponse,
  MoveItemArgs,
  MoveItemResult,
} from '../types/mcp-tools';

/**
 * Move an item between characters or vault
 *
 * Uses direct Bungie API calls with authentication from the browser
 */
export async function moveItem(args: MoveItemArgs): Promise<MCPToolResponse> {
  const { itemId, toCharacterId } = args;

  try {
    console.log('[MCP] Moving item:', itemId, 'to:', toCharacterId);

    // Create authenticated client (throws if auth not set up)
    const { httpClient, membershipId } = await createAuthenticatedBungieClient();

    // Get linked profiles to find the Destiny membership type
    console.log('[MCP] Fetching linked profiles...');
    const linkedProfiles = await getLinkedProfiles(httpClient, {
      membershipId,
      membershipType: 254, // BungieNext (Bungie.net)
      getAllMemberships: true,
    });

    if (!linkedProfiles?.Response?.profiles || linkedProfiles.Response.profiles.length === 0) {
      throw new Error('No Destiny profiles found for this Bungie.net account');
    }

    // Use the first Destiny profile
    const destinyProfile = linkedProfiles.Response.profiles[0];
    const destinyMembershipId = destinyProfile.membershipId;
    const membershipType = destinyProfile.membershipType;

    console.log('[MCP] Fetching inventory to locate item...');
    // Fetch inventory to find the item and get its details
    const profileResponse = await getProfile(httpClient, {
      destinyMembershipId,
      membershipType,
      components: [
        DestinyComponentType.ProfileInventories,
        DestinyComponentType.CharacterInventories,
        DestinyComponentType.CharacterEquipment,
      ],
    });

    if (!profileResponse?.Response) {
      throw new Error('Failed to fetch profile from Bungie API');
    }

    const profile = profileResponse.Response;

    // Find the item in inventory
    let foundItem: any = null;
    let sourceCharacterId: string | null = null;
    let isInVault = false;

    // Check vault
    if (profile.profileInventory?.data?.items) {
      foundItem = profile.profileInventory.data.items.find(
        (item: any) => item.itemInstanceId === itemId,
      );
      if (foundItem) {
        isInVault = true;
        console.log('[MCP] Item found in vault');
      }
    }

    // Check character inventories
    if (!foundItem && profile.characterInventories?.data) {
      for (const [characterId, inventory] of Object.entries(profile.characterInventories.data)) {
        foundItem = (inventory as any).items.find((item: any) => item.itemInstanceId === itemId);
        if (foundItem) {
          sourceCharacterId = characterId;
          console.log('[MCP] Item found on character:', characterId.slice(0, 8));
          break;
        }
      }
    }

    // Check equipped items
    if (!foundItem && profile.characterEquipment?.data) {
      for (const [characterId, equipment] of Object.entries(profile.characterEquipment.data)) {
        foundItem = (equipment as any).items.find((item: any) => item.itemInstanceId === itemId);
        if (foundItem) {
          sourceCharacterId = characterId;
          console.log('[MCP] Item found equipped on character:', characterId.slice(0, 8));
          break;
        }
      }
    }

    if (!foundItem) {
      throw new Error(`Item ${itemId} not found in inventory`);
    }

    // Determine if we're moving to vault or to a character
    const transferToVault = toCharacterId.toLowerCase() === 'vault';

    // Prepare transfer parameters
    let characterId: string;
    if (transferToVault) {
      // Moving to vault - characterId is the source
      if (!sourceCharacterId) {
        throw new Error('Cannot move item from vault to vault');
      }
      characterId = sourceCharacterId;
    } else {
      // Moving to character - characterId is the destination
      characterId = toCharacterId;
    }

    console.log('[MCP] Transferring item...');
    // Call Bungie API to transfer the item
    const transferResponse = await transferItem(httpClient, {
      itemReferenceHash: foundItem.itemHash,
      stackSize: foundItem.quantity || 1,
      transferToVault,
      itemId,
      characterId,
      membershipType,
    });

    if (transferResponse.ErrorCode !== 1) {
      throw new Error(
        `Bungie API error: ${transferResponse.Message} (code ${transferResponse.ErrorCode})`,
      );
    }

    const fromLocation = isInVault ? 'Vault' : `Character ${sourceCharacterId?.slice(0, 8)}`;
    const toLocation = transferToVault ? 'Vault' : `Character ${toCharacterId.slice(0, 8)}`;

    const result: MoveItemResult = {
      success: true,
      message: `Successfully moved item from ${fromLocation} to ${toLocation}`,
      item: {
        name: 'Item',
        fromLocation,
        toLocation,
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ...result,
              _note: 'Item moved successfully',
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    console.error('[MCP] Error in moveItem:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Move failed',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          }),
        },
      ],
    };
  }
}

/**
 * Equip an item on a character
 *
 * Uses direct Bungie API calls with authentication from the browser
 */
export async function equipItem(args: EquipItemArgs): Promise<MCPToolResponse> {
  const { itemId, characterId } = args;

  try {
    console.log('[MCP] Equipping item:', itemId, 'on character:', characterId);

    // Create authenticated client (throws if auth not set up)
    const { httpClient, membershipId } = await createAuthenticatedBungieClient();

    // Get linked profiles to find the Destiny membership type
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

    // Use the first Destiny profile
    const destinyProfile = linkedProfiles.Response.profiles[0];
    const membershipType = destinyProfile.membershipType;

    console.log('[MCP] Equipping item on platform:', membershipType);

    // Call Bungie API to equip the item
    const equipResponse = await bungieEquipItem(httpClient, {
      itemId,
      characterId,
      membershipType,
    });

    if (equipResponse.ErrorCode !== 1) {
      throw new Error(
        `Bungie API error: ${equipResponse.Message} (code ${equipResponse.ErrorCode})`,
      );
    }

    const result: EquipItemResult = {
      success: true,
      message: `Successfully equipped item on character ${characterId.slice(0, 8)}`,
      item: {
        name: 'Item',
        type: 'Unknown',
        characterClass: 'Unknown',
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ...result,
              _note: 'Item equipped successfully',
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    console.error('[MCP] Error in equipItem:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Equip failed',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          }),
        },
      ],
    };
  }
}
