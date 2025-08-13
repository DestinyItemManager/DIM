import { getBuckets } from 'app/destiny2/d2-buckets';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { ItemCreationContext, makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { armorStats, ARTIFICE_PERK_HASH } from 'app/search/d2-known-values';
import { mapValues } from 'app/utils/collections';
import {
  ComponentPrivacySetting,
  DestinyClass,
  DestinyEnergyType,
  DestinyInventoryItemDefinition,
  DestinyItemComponentSetOfint64,
  DestinyItemInstanceComponent,
  DestinyItemSocketState,
  DestinyItemStatsComponent,
  TierType,
} from 'bungie-api-ts/destiny2';
import { BucketHashes, ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import { DimItem, DimStat } from '../app/inventory/item-types';
import { getTestProfile } from './test-utils';

/**
 * Options for creating test armor items.
 */
export interface CreateTestArmorOptions {
  /** Which armor slot (default: Helmet) */
  bucketHash?: BucketHashes;
  /** Which class the armor is for (default: Hunter) */
  classType?: DestinyClass;
  /** Stats specification - either object form or array form. Any unmentioned stats will be zero. */
  stats?:
    | { [statHash: number]: number } // Object form: { [StatHashes.Health]: 15, ... }
    | number[]; // Array form: [health, melee, grenade, super, class, weapons]
  /** Tier level 0-5 (default: 1) */
  tier?: number;
  /** Has artifice socket (default: false, requires tier 0) */
  isArtifice?: boolean;
  /** Masterwork status (default: false) */
  masterworked?: boolean;
  /** Exotic vs legendary (default: false) */
  isExotic?: boolean;
  /** Specific item hash (auto-selected if not provided) */
  itemHash?: number;
}

/**
 * Override armor stats on a DIM item after creation.
 * This is necessary because DIM calculates stats from sockets and base item data,
 * so we need to override the final calculated stats with our custom values.
 */
function overrideArmorStats(item: DimItem, customStatValues: { [statHash: number]: number }): void {
  if (!item.stats) {
    return;
  }

  // Create new stat objects with our custom values
  const newStats: DimStat[] = armorStats.map((statHash) => {
    const existingStat = item.stats?.find((s) => s.statHash === statHash);
    const customValue = customStatValues[statHash] || 0;

    return {
      statHash,
      displayProperties: existingStat?.displayProperties || {
        name: `Stat ${statHash}`,
        description: '',
        icon: '',
        hasIcon: false,
        iconSequences: [],
        highResIcon: '',
      },
      sort: existingStat?.sort || 0,
      base: customValue,
      value: customValue,
      maximumValue: existingStat?.maximumValue || 30,
      bar: existingStat?.bar ?? true,
      smallerIsBetter: existingStat?.smallerIsBetter ?? false,
      investmentValue: customValue,
      additive: true, // Armor stats are additive
    };
  });

  // Preserve any non-armor stats (like defense)
  const nonArmorStats = item.stats.filter((stat) => !armorStats.includes(stat.statHash));

  // Replace the item's stats with our custom stats plus any non-armor stats
  item.stats = [...newStats, ...nonArmorStats];
}

/**
 * Main factory function for creating test armor items.
 * Uses the actual manifest and item creation functions for realistic behavior.
 */
export function createTestArmor(
  defs: D2ManifestDefinitions,
  {
    bucketHash = BucketHashes.Helmet,
    classType = DestinyClass.Hunter,
    tier = 1,
    isArtifice = false,
    masterworked = false,
    isExotic = false,
    itemHash,
    stats,
  }: CreateTestArmorOptions = {},
): DimItem {
  const profileResponse = getTestProfile();
  const buckets = getBuckets(defs);

  // Validation: artifice armor must be tier 0
  if (isArtifice && tier !== 0) {
    throw new Error('Artifice armor must be tier 0');
  }

  // Get appropriate item hash if not provided
  const selectedItemHash = itemHash || selectArmorItemHash(defs, bucketHash, classType, isExotic);

  // Generate stats specification
  const armorStatValues = generateStatValues(stats);

  // Generate consistent instance ID
  const instanceId = generateInstanceId();

  // Create the base item context with custom socket configuration
  const context: ItemCreationContext = {
    defs,
    buckets,
    profileResponse,
    customStats: [],
    itemComponents: createCustomItemComponents(
      defs,
      selectedItemHash,
      armorStatValues,
      instanceId,
      {
        tier,
        isArtifice,
        masterworked,
      },
    ),
  };

  // Create the item using DIM's existing factory
  const item = makeFakeItem(context, selectedItemHash, {
    itemInstanceId: instanceId,
  });

  if (!item) {
    throw new Error('Failed to create armor item');
  }

  // Override stats after creation if custom stats were provided
  if (stats) {
    overrideArmorStats(item, armorStatValues);
  }

  return item;
}

/**
 * Select an appropriate armor item hash based on bucket, class, and exotic status.
 */
function selectArmorItemHash(
  defs: D2ManifestDefinitions,
  bucketHash: BucketHashes,
  classType: DestinyClass,
  isExotic: boolean,
): number {
  // Find armor items that match our criteria
  const allItems = Object.values(defs.InventoryItem.getAll());
  const candidates = allItems.filter((item: DestinyInventoryItemDefinition) => {
    if (!item.inventory?.bucketTypeHash || item.inventory.bucketTypeHash !== bucketHash) {
      return false;
    }

    // Check class compatibility - allow Unknown (universal) or matching class
    if (item.classType !== classType) {
      return false;
    }

    const isItemExotic = item.inventory?.tierType === TierType.Exotic; // Exotic tier
    if (isExotic !== isItemExotic) {
      return false;
    }

    // Must be armor
    if (!item.itemCategoryHashes?.includes(ItemCategoryHashes.Armor)) {
      return false;
    }

    // Exclude classified items
    if (item.redacted) {
      return false;
    }

    return true;
  });

  if (candidates.length === 0) {
    throw new Error(
      `No suitable armor found for bucket ${bucketHash}, class ${classType}, exotic: ${isExotic}`,
    );
  }

  // Prefer non-sunset items (power cap > 1350) if available
  const nonSunsetCandidates = candidates.filter(
    (item) => !item.quality?.currentVersion || item.quality.currentVersion >= 4,
  );

  // Return the first suitable candidate
  return (nonSunsetCandidates.length > 0 ? nonSunsetCandidates[0] : candidates[0]).hash;
}

/**
 * Generate stat values from the flexible input format.
 */
function generateStatValues(stats?: { [statHash: number]: number } | number[]): {
  [statHash: number]: number;
} {
  if (!stats) {
    // Generate realistic random stats totaling 60-70
    const total = Math.floor(Math.random() * 11) + 60; // 60-70
    stats = distributeStatPoints(total);
    console.log('Generated random stats:', stats);
  }

  if (Array.isArray(stats)) {
    if (stats.length !== 6) {
      throw new Error(
        'Stats array must have exactly 6 values: [health, melee, grenade, super, class, weapons]',
      );
    }
    return {
      [StatHashes.Health]: stats[0],
      [StatHashes.Melee]: stats[1],
      [StatHashes.Grenade]: stats[2],
      [StatHashes.Super]: stats[3],
      [StatHashes.Class]: stats[4],
      [StatHashes.Weapons]: stats[5],
    };
  }

  // Object format - validate it has armor stats
  for (const statHash of armorStats) {
    if (!(statHash in stats)) {
      throw new Error(`Missing required armor stat: ${statHash}`);
    }
  }

  return stats;
}

/**
 * Distribute stat points randomly but realistically across 6 stats.
 */
function distributeStatPoints(total: number): number[] {
  const values = [0, 0, 0, 0, 0, 0];
  let remaining = total;

  // Distribute points
  while (remaining > 0) {
    const index = Math.floor(Math.random() * 6);
    const add = Math.min(remaining, Math.floor(Math.random() * 5) + 1);
    values[index] += add;
    remaining -= add;
  }

  return values;
}

/**
 * Create custom item components that include our desired socket configuration.
 */
function createCustomItemComponents(
  defs: D2ManifestDefinitions,
  itemHash: number,
  statValues: { [statHash: number]: number },
  instanceId: string,
  options: {
    tier: number;
    isArtifice: boolean;
    masterworked: boolean;
  },
): Partial<DestinyItemComponentSetOfint64> {
  const itemDef = defs.InventoryItem.get(itemHash);

  // Basic stats based on our desired values
  const stats = mapValues(statValues, (value, statHash) => ({
    statHash: parseInt(statHash),
    value,
  }));

  // Create proper instance component with all required fields
  const instanceComponent: DestinyItemInstanceComponent = {
    damageType: 0,
    damageTypeHash: 0, // Fix: use 0 instead of null
    primaryStat: {
      statHash: StatHashes.Defense,
      value: 50,
    },
    itemLevel: 1,
    quality: 0,
    isEquipped: false,
    canEquip: true,
    equipRequiredLevel: 0,
    unlockHashesRequiredToEquip: [],
    cannotEquipReason: 0,
    energy: {
      energyCapacity: options.tier >= 4 ? 11 : 10,
      energyUsed: 0,
      energyType: DestinyEnergyType.Any,
      energyTypeHash: 0, // Required field
      energyUnused: 0, // Required field
    },
    gearTier: options.tier, // Set the gear tier for proper tier calculation
  };

  // Create stats component with all required fields
  const statsComponent: DestinyItemStatsComponent = {
    stats,
  };

  const components: Partial<DestinyItemComponentSetOfint64> = {
    instances: {
      data: {
        [instanceId]: instanceComponent,
      },
      privacy: ComponentPrivacySetting.Public,
    },
    stats: {
      data: {
        [instanceId]: statsComponent,
      },
      privacy: ComponentPrivacySetting.Public,
    },
  };

  // Add socket configurations if we have specific requirements
  if (options.isArtifice || options.tier > 0 || options.masterworked) {
    const socketsData = createSocketConfiguration(itemDef, options);
    const socketsComponent = {
      data: {
        [instanceId]: {
          sockets: socketsData,
        },
      },
      privacy: ComponentPrivacySetting.Public,
    };

    // Create a new components object with sockets
    return {
      ...components,
      sockets: socketsComponent,
    };
  }

  return components;
}

/**
 * Create socket configuration for artifice, tier, and masterwork features.
 */
function createSocketConfiguration(
  itemDef: DestinyInventoryItemDefinition,
  options: {
    tier: number;
    isArtifice: boolean;
    masterworked: boolean;
  },
): DestinyItemSocketState[] {
  const sockets: DestinyItemSocketState[] = [];

  // Start with base sockets from item definition
  if (itemDef.sockets?.socketEntries) {
    for (let i = 0; i < itemDef.sockets.socketEntries.length; i++) {
      const socketEntry = itemDef.sockets.socketEntries[i];
      // Remove unused socketType variable to fix warning
      // const socketType = defs.SocketType.get(socketEntry.socketTypeHash);

      sockets.push({
        plugHash:
          socketEntry.singleInitialItemHash ||
          socketEntry.reusablePlugItems?.[0]?.plugItemHash ||
          0,
        isEnabled: true,
        isVisible: true,
        enableFailIndexes: [],
      });
    }
  }

  // Add artifice socket if requested
  if (options.isArtifice) {
    sockets.push({
      plugHash: ARTIFICE_PERK_HASH,
      isEnabled: true,
      isVisible: true,
      enableFailIndexes: [],
    });
  }

  // Add tier-specific sockets (tuning socket for tier 5)
  if (options.tier === 5) {
    // Add a tuning socket - this is a simplified implementation
    sockets.push({
      plugHash: 3122197216, // Balanced Tuning plug hash from known values
      isEnabled: true,
      isVisible: true,
      enableFailIndexes: [],
    });
  }

  // Configure masterwork socket if needed
  if (options.masterworked && sockets.length > 0) {
    // Find what might be a masterwork socket and configure it
    // This is simplified - in reality we'd need to find the right socket type
    const lastSocketIndex = sockets.length - 1;
    if (lastSocketIndex >= 0) {
      // For armor, masterwork typically provides +2 to all stats
      // The actual implementation would use proper masterwork plug hashes
      sockets[lastSocketIndex] = {
        ...sockets[lastSocketIndex],
        plugHash: sockets[lastSocketIndex].plugHash || 0, // Keep existing or use default
        isEnabled: true,
        isVisible: true,
      };
    }
  }

  return sockets;
}

/**
 * Generate a unique instance ID for test items.
 */
function generateInstanceId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
