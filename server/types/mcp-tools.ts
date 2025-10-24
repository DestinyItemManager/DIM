/**
 * Type definitions for MCP tools
 */

// Tool input types
export interface SearchInventoryArgs {
  query: string; // DIM search syntax (e.g., "is:weapon tag:favorite")
}

export interface MoveItemArgs {
  itemId: string; // Item instance ID
  toCharacterId: string; // Destination character ID or "vault"
}

export interface EquipItemArgs {
  itemId: string; // Item instance ID
  characterId: string; // Character to equip on
}

export interface ListCharactersArgs {
  // No arguments needed
}

// Tool output types
export interface CharacterInfo {
  id: string;
  class: string;
  race: string;
  gender: string;
  light: number;
  emblemPath?: string;
}

export interface ListCharactersResult {
  characters: CharacterInfo[];
  totalCount: number;
}

export interface MoveItemResult {
  success: boolean;
  message: string;
  error?: string;
  item?: {
    name: string;
    fromLocation: string;
    toLocation: string;
  };
}

export interface EquipItemResult {
  success: boolean;
  message: string;
  error?: string;
  item?: {
    name: string;
    type: string;
    characterClass: string;
  };
  unequipped?: {
    name: string;
    type: string;
  };
}

// MCP Response wrapper
export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}
