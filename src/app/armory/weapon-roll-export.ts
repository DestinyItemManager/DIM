import { DimItem } from 'app/inventory/item-types';
import { getMasterworkStatNames } from 'app/utils/item-utils';
import { getWeaponArchetypeSocket, isWeaponMasterworkSocket } from 'app/utils/socket-utils';
import { ItemCategoryHashes } from 'data/d2/generated-enums';

/**
 * Exports a weapon roll as human-readable text format suitable for sharing
 * on platforms like /r/sharditkeepit
 */
export function formatWeaponRollForExport(item: DimItem): string {
  if (!item.bucket.inWeapons || !item.sockets) {
    return '';
  }

  const lines: string[] = [];

  // Weapon name
  lines.push(item.name);
  lines.push('');

  // Intrinsic Perk / Frame (Archetype)
  const archetypeSocket = getWeaponArchetypeSocket(item);
  if (archetypeSocket?.plugged?.plugDef.displayProperties.name) {
    lines.push(`* ${archetypeSocket.plugged.plugDef.displayProperties.name}`);
  }

  // Iterate through all perk sockets in order
  if (item.sockets) {
    for (const socket of item.sockets.allSockets) {
      // Only include perk sockets, excluding weapon mods, masterwork, and archetype
      if (
        socket.isPerk &&
        socket.plugOptions.length > 0 &&
        !isWeaponMasterworkSocket(socket) &&
        socket !== archetypeSocket
      ) {
        // Get all plug options for this socket, excluding weapon mod damage
        const plugNames = socket.plugOptions
          .filter(
            (plug) =>
              plug.plugDef.displayProperties.name &&
              !plug.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsDamage),
          )
          .map((plug) => plug.plugDef.displayProperties.name)
          .filter(Boolean);

        if (plugNames.length > 0) {
          lines.push(`* ${plugNames.join(' / ')}`);
        }
      }
    }
  }

  // Masterwork (if applicable)
  const masterworkStatName = getMasterworkStatNames(item.masterworkInfo);
  if (masterworkStatName) {
    lines.push('');
    lines.push(`* ${masterworkStatName}`);
  }

  return lines.join('\n');
}

/**
 * Copy text to clipboard using the modern Clipboard API
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Check if clipboard functionality is available
 */
export function isClipboardAvailable(): boolean {
  return Boolean(navigator.clipboard && window.isSecureContext);
}
