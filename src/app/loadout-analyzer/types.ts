import { LoadoutParameters, Settings } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import { AutoModDefs, ResolvedStatConstraint } from 'app/loadout-builder/types';
import { ItemFilter } from 'app/search/filter-types';

/** The analysis results for a single loadout. */
export interface LoadoutAnalysisResult {
  findings: LoadoutFinding[];
  /** A caveat to the "better stats available" note because it might be caused by DIM unintentionally considering font mods active */
  betterStatsAvailableFontNote: boolean;
  /** We took a closer look at the armor in this loadout and determined these results. */
  armorResults: ArmorAnalysisResult | undefined;
}

/**
 * If we're looking at all loadouts, this is the summary.
 */
export interface LoadoutAnalysisSummary {
  outdated: boolean;
  analyzedLoadouts: number;
  loadoutsByFindings: { [key in LoadoutFinding]: Set<string> };
}

export type ArmorAnalysisResult =
  | {
      tag: 'ineligible';
    }
  | {
      tag: 'done';
      /** Picking different armor and/or mods can produce strictly better stats. */
      betterStatsAvailable: LoadoutFinding.BetterStatsAvailable | undefined;
      /** If one were to start Loadout Optimizer from here, use these settings. */
      loadoutParameters: LoadoutParameters;
      /** And pass these to the Loadout Builder to show strict upgrades only */
      strictUpgradeStatConstraints: ResolvedStatConstraint[] | undefined;
    };

export const enum LoadoutFinding {
  /** This loadout has items specified that couldn't be found, */
  MissingItems = 1,
  /** This loadout specifies deprecated/invalid mods. */
  InvalidMods,
  /** The subclass in this loadout has some unused fragment slots available. */
  EmptyFragmentSlots,
  /** The subclass in this loadout has more fragments used than slots available. */
  TooManyFragments,
  /** This loadout's armor needs to be upgraded to fit mods/hit target stats. */
  NeedsArmorUpgrades,
  /**
   * The loadout uses mods that are only available in some seasons,
   * or might not fit all mods when the season ends and mods become more expensive.
   */
  UsesSeasonalMods,
  /** Picking different armor and/or mods can produce strictly better stats. */
  BetterStatsAvailable,
  /** The loadout has armor but not a full set of  5 equipped armor items, so we can't come up with stats to compare against. */
  NotAFullArmorSet,
  /** The loadout parameters specify an exotic but the loadout doesn't even have that exotic, so that's cheating! */
  DoesNotRespectExotic,
  /** The armor set does not fit all requested mods in the first place, so there's no meaningful comparison with other sets. */
  ModsDontFit,
  /** The armor set does not match the saved stat constraints. */
  DoesNotSatisfyStatConstraints,
  /** The loadout parameters search query is invalid or the items don't match them */
  InvalidSearchQuery,
}

/** These aren't problems per se but they do block further analysis */
export const blockAnalysisFindings: LoadoutFinding[] = [
  LoadoutFinding.NotAFullArmorSet,
  LoadoutFinding.ModsDontFit,
  LoadoutFinding.DoesNotRespectExotic,
];

/**
 * The context for analyzing a loadout. Results are considered stale
 * and will be rebuilt when anything in here changes.
 */
export interface LoadoutAnalysisContext {
  unlockedPlugs: Set<number>;
  itemCreationContext: ItemCreationContext;
  savedLoStatConstraintsByClass: Settings['loStatConstraintsByClass'];
  allItems: DimItem[];
  autoModDefs: AutoModDefs;
  validateQuery: (query: string) => { valid: boolean };
  filterFactory: (query: string) => ItemFilter;
}
