import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { ItemFilter } from 'app/search/filter-types';
import { ArmorStats } from './types';

export interface AutoOptimizationParameters {
  existingStats: ArmorStats;
  loadoutParameters: LoadoutParameters;
  subclass: ResolvedLoadoutItem | undefined;
  searchFilter: ItemFilter;
}

export type ArmorSetResult =
  | { tag: 'pending' }
  | { tag: 'finished'; result: AutoOptimizationResult }
  | { tag: 'error'; error: LoadoutError };

/**
 * We ran the auto-opt process for a set and this was the result.
 */
export const enum AutoOptimizationResult {
  /** This build is the best it could be. Hooray! */
  Nothing = 0,
  /** There's a set that is better or equal in all stats and better in at least one stat. */
  StrongBetterSet,
  /**
   * There's a set that matches the original constraints and compares more favorably
   * (higher tier total, or equal tier total and better in highest-priority stat, or...)
   */
  WeakBetterSet,
}

/**
 * A loadout was ineligible for auto-optimizing.
 */
export const enum LoadoutError {
  /** The armor set did not have 5 equipped armor items, so we can't come up with stats to compare against. */
  NotAFullArmorSet = 1,
  /** The armor set specifies an exotic but the loadout doesn't even have that exotic, so that's cheating! */
  DoesNotRespectExotic,
  /** The armor set does not fit all requested mods in the first place, so there's no meaningful comparison with other sets. */
  ModsDontFit,
  /** The loadout's search query is invalid */
  BadSearchQuery,
}

export interface AutoOptimizationReport {
  [loadoutId: string]: ArmorSetResult;
}
