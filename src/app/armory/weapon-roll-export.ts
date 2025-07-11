import { DimItem } from 'app/inventory/item-types';
import {
  getSocketsWithStyle,
  getWeaponArchetypeSocket,
  isWeaponMasterworkSocket,
} from 'app/utils/socket-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
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
  lines.push(`[${item.name}]`);
  lines.push('');

  // Intrinsic Perk / Frame (Archetype)
  const archetypeSocket = getWeaponArchetypeSocket(item);
  if (archetypeSocket?.plugged?.plugDef.displayProperties.name) {
    lines.push(`* ${archetypeSocket.plugged.plugDef.displayProperties.name}`);
  }

  // Sights/Barrels - these are typically large perks
  const largePerks = getSocketsWithStyle(item.sockets, DestinySocketCategoryStyle.LargePerk).filter(
    (socket) => socket.plugged?.plugDef.displayProperties.name,
  );

  if (largePerks.length > 0) {
    for (const socket of largePerks) {
      lines.push(`* ${socket.plugged!.plugDef.displayProperties.name}`);
    }
  }

  // Trait columns (reusable perks) - excluding weapon mods and masterwork
  const reusablePerks = getSocketsWithStyle(
    item.sockets,
    DestinySocketCategoryStyle.Reusable,
  ).filter((socket) => {
    if (!socket.plugged?.plugDef.displayProperties.name) {
      return false;
    }

    // Skip weapon mods
    if (socket.plugged.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsDamage)) {
      return false;
    }

    // Skip masterwork sockets
    return !isWeaponMasterworkSocket(socket);
  });

  for (const socket of reusablePerks) {
    lines.push(`* ${socket.plugged!.plugDef.displayProperties.name}`);
  }

  // Masterwork (if applicable)
  const masterworkSocket = item.sockets.allSockets.find(isWeaponMasterworkSocket);
  if (masterworkSocket?.plugged?.plugDef.displayProperties.name) {
    lines.push('');
    lines.push(`* ${masterworkSocket.plugged.plugDef.displayProperties.name}`);
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
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
