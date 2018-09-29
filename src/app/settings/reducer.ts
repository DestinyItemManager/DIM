import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { RootState } from '../store/reducers';
import { defaultLanguage } from '../i18n';

export const characterOrderSelector = (state: RootState) => state.settings.characterOrder;

export const itemSortOrderSelector = (state: RootState) =>
  (state.settings.itemSort === 'custom'
    ? state.settings.itemSortOrderCustom
    : itemSortPresets[state.settings.itemSort]) || itemSortPresets.primaryStat;

export type CharacterOrder = 'mostRecent' | 'mostRecentReverse' | 'fixed';

export interface Settings {
  // Show full details in item popup
  readonly itemDetails: boolean;
  // Show item quality percentages
  readonly itemQuality: boolean;
  // Show new items with an overlay
  readonly showNewItems: boolean;
  // Show animation of new item overlay on new items
  readonly showNewAnimation: boolean;
  // Show item reviews
  readonly showReviews: boolean;
  // Show elemental damage icons
  readonly showElements: boolean;
  // Can we post identifying information to DTR?
  readonly allowIdPostToDtr: boolean;
  // Sort characters (mostRecent, mostRecentReverse, fixed)
  readonly characterOrder: CharacterOrder;
  // Sort items in buckets (primaryStat, rarityThenPrimary, quality)
  readonly itemSort: string;
  readonly itemSortOrderCustom: string[];
  // How many columns to display character buckets
  readonly charCol: 3;
  // How many columns to display character buckets on Mobile
  readonly charColMobile: 3;
  // How many columns to display vault buckets
  readonly vaultMaxCol: 999;
  // How big in pixels to draw items - start smaller for iPad
  readonly itemSize: number;
  // Which categories or buckets should be collapsed?
  readonly collapsedSections: { [key: string]: boolean };
  // What settings for farming mode
  readonly farming: {
    // Whether to keep one slot per item type open
    readonly makeRoomForItems: boolean;
    readonly moveTokens: boolean;
  };
  // Active destiny version
  readonly destinyVersion: 2;
  // Destiny 2 platform selection for ratings + reviews
  readonly reviewsPlatformSelection: 0;
  // Destiny 2 play mode selection for ratings + reviews - see DestinyActivityModeType for values
  readonly reviewsModeSelection: 0;

  readonly betaForsakenTiles: false;

  readonly language: string;

  readonly colorA11y: string;
}

const itemSortPresets = {
  primaryStat: ['primStat', 'name'],
  basePowerThenPrimary: ['basePower', 'primStat', 'name'],
  rarityThenPrimary: ['rarity', 'primStat', 'name'],
  quality: ['rating', 'name'],
  name: ['name'],
  typeThenPrimary: ['typeName', 'classType', 'primStat', 'name'],
  typeThenName: ['typeName', 'classType', 'name']
};

export const initialSettingsState: Settings = {
  // Show full details in item popup
  itemDetails: true,
  // Show item quality percentages
  itemQuality: true,
  // Show new items with an overlay
  showNewItems: false,
  // Show animation of new item overlay on new items
  showNewAnimation: true,
  // Show item reviews
  showReviews: true,
  // Show elemental damage icons
  showElements: false,
  // Can we post identifying information to DTR?
  allowIdPostToDtr: true,
  // Sort characters (mostRecent, mostRecentReverse, fixed)
  characterOrder: 'mostRecent',
  // Sort items in buckets (primaryStat, rarityThenPrimary, quality)
  itemSort: 'primaryStat',
  itemSortOrderCustom: Array.from(itemSortPresets.primaryStat),
  // How many columns to display character buckets
  charCol: 3,
  // How many columns to display character buckets on Mobile
  charColMobile: 3,
  // How many columns to display vault buckets
  vaultMaxCol: 999,
  // How big in pixels to draw items - start smaller for iPad
  itemSize: window.matchMedia('(max-width: 1025px)').matches ? 38 : 48,
  // Which categories or buckets should be collapsed?
  collapsedSections: {},
  // What settings for farming mode
  farming: {
    // Whether to keep one slot per item type open
    makeRoomForItems: true,
    moveTokens: false
  },
  // Active destiny version
  destinyVersion: 2,
  // Destiny 2 platform selection for ratings + reviews
  reviewsPlatformSelection: 0,
  // Destiny 2 play mode selection for ratings + reviews - see DestinyActivityModeType for values
  reviewsModeSelection: 0,

  betaForsakenTiles: false,

  language: defaultLanguage(),

  colorA11y: '-'
};

export type SettingsAction = ActionType<typeof actions>;

// TODO: Figure out how to drive saving settings from this state
export const settings: Reducer<Settings, SettingsAction> = (
  state: Settings = initialSettingsState,
  action: SettingsAction
) => {
  switch (action.type) {
    case getType(actions.loaded):
      return {
        ...state,
        ...action.payload,
        farming: {
          ...state.farming,
          ...action.payload.farming
        }
      };
    case getType(actions.set):
      return {
        ...state,
        settings: {
          ...state,
          [action.payload.property]: action.payload.value
        }
      };
    default:
      return state;
  }
};
