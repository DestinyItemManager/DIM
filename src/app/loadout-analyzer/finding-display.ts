import { I18nKey, tl } from 'app/i18next-t';
import { faArrowCircleUp, faExclamationTriangle, infoIcon } from 'app/shell/icons';
import { LoadoutFinding } from './types';

export interface FindingDisplay {
  name: I18nKey;
  description: I18nKey;
  icon: string | undefined;
}

export const findingDisplays: Record<LoadoutFinding, FindingDisplay> = {
  [LoadoutFinding.MissingItems]: {
    name: tl('LoadoutAnalysis.MissingItems.Name'),
    description: tl('LoadoutAnalysis.MissingItems.Description'),
    icon: faExclamationTriangle,
  },
  [LoadoutFinding.InvalidMods]: {
    name: tl('LoadoutAnalysis.InvalidMods.Name'),
    description: tl('LoadoutAnalysis.InvalidMods.Description'),
    icon: faExclamationTriangle,
  },
  [LoadoutFinding.EmptyFragmentSlots]: {
    name: tl('LoadoutAnalysis.EmptyFragmentSlots.Name'),
    description: tl('LoadoutAnalysis.EmptyFragmentSlots.Description'),
    icon: faArrowCircleUp,
  },
  [LoadoutFinding.TooManyFragments]: {
    name: tl('LoadoutAnalysis.TooManyFragments.Name'),
    description: tl('LoadoutAnalysis.TooManyFragments.Description'),
    icon: faExclamationTriangle,
  },
  [LoadoutFinding.NeedsArmorUpgrades]: {
    name: tl('LoadoutAnalysis.NeedsArmorUpgrades.Name'),
    description: tl('LoadoutAnalysis.NeedsArmorUpgrades.Description'),
    icon: infoIcon,
  },
  [LoadoutFinding.BetterStatsAvailable]: {
    name: tl('LoadoutAnalysis.BetterStatsAvailable.Name'),
    description: tl('LoadoutAnalysis.BetterStatsAvailable.Description'),
    icon: faArrowCircleUp,
  },
  [LoadoutFinding.NotAFullArmorSet]: {
    name: tl('LoadoutAnalysis.NotAFullArmorSet.Name'),
    description: tl('LoadoutAnalysis.NotAFullArmorSet.Description'),
    icon: undefined,
  },
  [LoadoutFinding.DoesNotRespectExotic]: {
    name: tl('LoadoutAnalysis.DoesNotRespectExotic.Name'),
    description: tl('LoadoutAnalysis.DoesNotRespectExotic.Description'),
    icon: infoIcon,
  },
  [LoadoutFinding.ModsDontFit]: {
    name: tl('LoadoutAnalysis.ModsDontFit.Name'),
    description: tl('LoadoutAnalysis.ModsDontFit.Description'),
    icon: faExclamationTriangle,
  },
  [LoadoutFinding.UsesSeasonalMods]: {
    name: tl('LoadoutAnalysis.UsesSeasonalMods.Name'),
    description: tl('LoadoutAnalysis.UsesSeasonalMods.Description'),
    icon: infoIcon,
  },
  [LoadoutFinding.DoesNotSatisfyStatConstraints]: {
    name: tl('LoadoutAnalysis.DoesNotSatisfyStatConstraints.Name'),
    description: tl('LoadoutAnalysis.DoesNotSatisfyStatConstraints.Description'),
    icon: infoIcon,
  },
  [LoadoutFinding.InvalidSearchQuery]: {
    name: tl('LoadoutAnalysis.InvalidSearchQuery.Name'),
    description: tl('LoadoutAnalysis.InvalidSearchQuery.Description'),
    icon: faExclamationTriangle,
  },
};
