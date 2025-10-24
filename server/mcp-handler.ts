/**
 * MCP tool handlers - registers tools and dispatches requests
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { MCPToolResponse } from './types/mcp-tools';

// Tool implementations
import { listCharacters } from './tools/character-tools';
import { searchInventory } from './tools/inventory-tools';
import { equipItem, moveItem } from './tools/item-tools';

/**
 * Register all MCP tool handlers
 */
export function createMCPHandlers(server: Server) {
  // List all available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'search_inventory',
        description:
          'Search your Destiny 2 inventory. Supports: name searches, is:exotic/legendary, type:weapon/armor, is:vault/equipped, stat comparisons (stability:>50), perk searches (perk:Rampage). Examples: "is:exotic", "stability:>50 is:weapon", "name:Austringer", "perk:Rampage is:vault"',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'Search query. Combine multiple terms with spaces. Examples: "is:exotic", "stability:>50", "name:Austringer", "perk:Rampage type:weapon"',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_characters',
        description:
          'List all characters on your Destiny 2 account. Returns character IDs, classes, races, and power levels. Use the character IDs for move_item and equip_item operations.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'move_item',
        description:
          'Move an item between characters or to/from the vault. Requires item ID and destination.',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description: 'The unique instance ID of the item to move',
            },
            toCharacterId: {
              type: 'string',
              description: 'Character ID to move to, or "vault" for the vault',
            },
          },
          required: ['itemId', 'toCharacterId'],
        },
      },
      {
        name: 'equip_item',
        description: 'Equip an item on a specific character.',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description: 'The unique instance ID of the item to equip',
            },
            characterId: {
              type: 'string',
              description: 'The character ID to equip the item on',
            },
          },
          required: ['itemId', 'characterId'],
        },
      },
    ],
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: MCPToolResponse;

      switch (name) {
        case 'search_inventory':
          result = await searchInventory(args as any);
          break;

        case 'list_characters':
          result = await listCharacters(args as any);
          break;

        case 'move_item':
          result = await moveItem(args as any);
          break;

        case 'equip_item':
          result = await equipItem(args as any);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return result as any;
    } catch (error) {
      console.error(`[MCP] Error executing tool ${name}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Tool execution failed',
              message: error instanceof Error ? error.message : String(error),
            }),
          },
        ],
      } as any;
    }
  });

  console.log('[MCP] Tool handlers registered:');
  console.log('  - search_inventory');
  console.log('  - list_characters');
  console.log('  - move_item');
  console.log('  - equip_item');
}
