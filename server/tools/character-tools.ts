/**
 * Character management tools for MCP
 *
 * Provides information about the player's characters
 */

import { DestinyComponentType, getLinkedProfiles, getProfile } from 'bungie-api-ts/destiny2';
import { getApiKey } from '../../config/mcp-middleware';
import { authManager } from '../auth/bungie-auth';
import { createBungieHttpClient } from '../auth/http-client';
import type {
  ListCharactersArgs,
  ListCharactersResult,
  MCPToolResponse,
} from '../types/mcp-tools';

/**
 * List all characters on the account
 */
export async function listCharacters(
  _args: ListCharactersArgs,
): Promise<MCPToolResponse> {
  try {
    // Check authentication
    await authManager.initialize();
    const accessToken = await authManager.getAccessToken();
    const membershipId = authManager.getMembershipId();

    if (!accessToken || !membershipId) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Not authenticated',
              message:
                'A browser window should open automatically to DIM. Please log in with your Bungie account.',
              instructions:
                'After logging in, tokens will sync automatically. Then try your request again.',
              fallback:
                'If the browser did not open, manually go to https://localhost:8080 and log in.',
            }),
          },
        ],
      };
    }

    console.log('[MCP] Fetching characters for Bungie.net membership:', membershipId);

    // Get API key from browser
    const bungieApiKey = getApiKey();
    if (!bungieApiKey) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'No API key available',
              message:
                'Please ensure you have configured your Bungie API key in DIM developer settings',
            }),
          },
        ],
      };
    }

    // Create HTTP client using shared implementation
    const httpClient = createBungieHttpClient(bungieApiKey, accessToken);

    // Get linked profiles to find the Destiny membership ID
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

    console.log(
      '[MCP] Found Destiny profile:',
      destinyMembershipId,
      'platform:',
      membershipType,
    );

    // Fetch character data
    console.log('[MCP] Fetching characters...');
    const profileResponse = await getProfile(httpClient, {
      destinyMembershipId,
      membershipType,
      components: [DestinyComponentType.Characters],
    });

    if (!profileResponse?.Response) {
      throw new Error('Failed to fetch profile from Bungie API');
    }

    const characters = profileResponse.Response.characters?.data;
    if (!characters) {
      throw new Error('No character data found');
    }

    // Map class IDs to names
    const classNames: Record<number, string> = {
      0: 'Titan',
      1: 'Hunter',
      2: 'Warlock',
    };

    const raceNames: Record<number, string> = {
      0: 'Human',
      1: 'Awoken',
      2: 'Exo',
    };

    const genderNames: Record<number, string> = {
      0: 'Male',
      1: 'Female',
    };

    const characterList = Object.entries(characters).map(([characterId, character]) => ({
      id: characterId,
      class: classNames[character.classType] || 'Unknown',
      race: raceNames[character.raceType] || 'Unknown',
      gender: genderNames[character.genderType] || 'Unknown',
      light: character.light,
      emblemPath: character.emblemPath,
    }));

    const result: ListCharactersResult = {
      characters: characterList,
      totalCount: characterList.length,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ...result,
              _note: `Found ${characterList.length} characters. Use the 'id' field for move_item and equip_item operations.`,
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    console.error('[MCP] Error in listCharacters:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'Failed to list characters',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          }),
        },
      ],
    };
  }
}
