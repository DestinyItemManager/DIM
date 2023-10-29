import { I18nKey, tl } from 'app/i18next-t';
import { faArrowCircleUp, faExclamationTriangle, infoIcon } from 'app/shell/icons';
import { LoadoutFinding } from './types';

export const enum FindingStyle {
  /** An opportunity to improve the loadout. */
  Good,
  /** A problem with the loadout as is (will likely fail application or not do desired things) */
  Bad,
  /** A useful info the user can take into account or ignore. */
  Info,
  /**
   * Only a reason a loadout might not have been included in optimization.
   * Not really a problem, don't bother showing a filter pill for.
   */
  Diagnostic,
}

export const iconsForFindingStyle: Record<FindingStyle, string | undefined> = {
  [FindingStyle.Good]: faArrowCircleUp,
  [FindingStyle.Bad]: faExclamationTriangle,
  [FindingStyle.Info]: infoIcon,
  [FindingStyle.Diagnostic]: undefined,
};

export interface FindingDisplay {
  name: I18nKey;
  description: I18nKey;
  style: FindingStyle;
}

export const findingDisplays: Record<LoadoutFinding, FindingDisplay> = {
  [LoadoutFinding.MissingItems]: {
    name: tl('LoadoutAnalysis.MissingItems.Name'),
    description: tl('LoadoutAnalysis.MissingItems.Description'),
    style: FindingStyle.Bad,
  },
  [LoadoutFinding.InvalidMods]: {
    name: tl('LoadoutAnalysis.InvalidMods.Name'),
    description: tl('LoadoutAnalysis.InvalidMods.Description'),
    style: FindingStyle.Bad,
  },
  [LoadoutFinding.EmptyFragmentSlots]: {
    name: tl('LoadoutAnalysis.EmptyFragmentSlots.Name'),
    description: tl('LoadoutAnalysis.EmptyFragmentSlots.Description'),
    style: FindingStyle.Good,
  },
  [LoadoutFinding.TooManyFragments]: {
    name: tl('LoadoutAnalysis.TooManyFragments.Name'),
    description: tl('LoadoutAnalysis.TooManyFragments.Description'),
    style: FindingStyle.Bad,
  },
  [LoadoutFinding.NeedsArmorUpgrades]: {
    name: tl('LoadoutAnalysis.NeedsArmorUpgrades.Name'),
    description: tl('LoadoutAnalysis.NeedsArmorUpgrades.Description'),
    style: FindingStyle.Info,
  },
  [LoadoutFinding.BetterStatsAvailable]: {
    name: tl('LoadoutAnalysis.BetterStatsAvailable.Name'),
    description: tl('LoadoutAnalysis.BetterStatsAvailable.Description'),
    style: FindingStyle.Good,
  },
  [LoadoutFinding.NotAFullArmorSet]: {
    name: tl('LoadoutAnalysis.NotAFullArmorSet.Name'),
    description: tl('LoadoutAnalysis.NotAFullArmorSet.Description'),
    style: FindingStyle.Diagnostic,
  },
  [LoadoutFinding.DoesNotRespectExotic]: {
    name: tl('LoadoutAnalysis.DoesNotRespectExotic.Name'),
    description: tl('LoadoutAnalysis.DoesNotRespectExotic.Description'),
    style: FindingStyle.Info,
  },
  [LoadoutFinding.ModsDontFit]: {
    name: tl('LoadoutAnalysis.ModsDontFit.Name'),
    description: tl('LoadoutAnalysis.ModsDontFit.Description'),
    style: FindingStyle.Bad,
  },
  [LoadoutFinding.DoesNotSatisfyStatConstraints]: {
    name: tl('LoadoutAnalysis.DoesNotSatisfyStatConstraints.Name'),
    description: tl('LoadoutAnalysis.DoesNotSatisfyStatConstraints.Description'),
    style: FindingStyle.Info,
  },
  [LoadoutFinding.LoadoutHasSearchQuery]: {
    name: tl('LoadoutAnalysis.LoadoutHasSearchQuery.Name'),
    description: tl('LoadoutAnalysis.LoadoutHasSearchQuery.Description'),
    style: FindingStyle.Diagnostic,
  },
};
