import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import * as _ from 'lodash';
import { defaultLanguage } from '../i18n';

export type CharacterOrder = 'mostRecent' | 'mostRecentReverse' | 'fixed' | 'custom';

export interface Settings {
  /** Show full details in item popup */
  readonly itemDetails: boolean;
  /** Show item quality percentages */
  readonly itemQuality: boolean;
  /** Show new items with an overlay */
  readonly showNewItems: boolean;
  /** Show animation of new item overlay on new items */
  readonly showNewAnimation: boolean;
  /** Show item reviews */
  readonly showReviews: boolean;
  /** Show elemental damage icons */
  readonly showElements: boolean;
  /** Can we post identifying information to DTR? */
  readonly allowIdPostToDtr: boolean;
  /** Sort characters (mostRecent, mostRecentReverse, fixed) */
  readonly characterOrder: CharacterOrder;
  /** Sort items in buckets (primaryStat, rarityThenPrimary, quality) */
  readonly itemSort: string;
  readonly itemSortOrderCustom: string[];
  /** How many columns to display character buckets */
  readonly charCol: 3;
  /** How many columns to display character buckets on Mobile */
  readonly charColMobile: 3;
  /** How many columns to display vault buckets */
  readonly vaultMaxCol: 999;
  /** How big in pixels to draw items - start smaller for iPad */
  readonly itemSize: number;
  /** Which categories or buckets should be collapsed? */
  readonly collapsedSections: { [key: string]: boolean };
  /** What settings for farming mode */
  readonly farming: {
    /** Whether to keep one slot per item type open */
    readonly makeRoomForItems: boolean;
    readonly moveTokens: boolean;
  };
  /** Destiny 2 platform selection for ratings + reviews */
  readonly reviewsPlatformSelection: 0;
  /** Destiny 2 play mode selection for ratings + reviews - see DestinyActivityModeType for values */
  readonly reviewsModeSelection: 0;

  /** Hide completed Destiny 1 records */
  readonly hideCompletedRecords: boolean;

  /** Custom character sort - across all accounts and characters! */
  readonly customCharacterSort: string[];

  readonly betaForsakenTiles: boolean;

  readonly language: string;

  readonly colorA11y: string;
}

export function defaultItemSize() {
  return window.matchMedia('(max-width: 1025px)').matches ? 38 : 48;
}

export const initialState: Settings = {
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
  itemSortOrderCustom: ['primStat', 'name'],
  // How many columns to display character buckets
  charCol: 3,
  // How many columns to display character buckets on Mobile
  charColMobile: 3,
  // How many columns to display vault buckets
  vaultMaxCol: 999,
  // How big in pixels to draw items - start smaller for iPad
  itemSize: defaultItemSize(),
  // Which categories or buckets should be collapsed?
  collapsedSections: {},
  // What settings for farming mode
  farming: {
    // Whether to keep one slot per item type open
    makeRoomForItems: true,
    moveTokens: false
  },
  // Destiny 2 platform selection for ratings + reviews
  reviewsPlatformSelection: 0,
  // Destiny 2 play mode selection for ratings + reviews - see DestinyActivityModeType for values
  reviewsModeSelection: 0,
  hideCompletedRecords: false,

  betaForsakenTiles: false,

  customCharacterSort: [],

  language: defaultLanguage(),

  colorA11y: '-'
};

export type SettingsAction = ActionType<typeof actions>;

export const settings: Reducer<Settings, SettingsAction> = (
  state: Settings = initialState,
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

    case getType(actions.toggleCollapsedSection):
      return {
        ...state,
        collapsedSections: {
          ...state.collapsedSections,
          [action.payload]: !state.collapsedSections[action.payload]
        }
      };

    case getType(actions.setSetting):
      if (state[action.payload.property] !== action.payload.value) {
        return {
          ...state,
          [action.payload.property]: action.payload.value
        };
      } else {
        return state;
      }

    case getType(actions.setCharacterOrder):
      const order = action.payload;
      return {
        ...state,
        // Remove these characters from the list and add them, in the new sort order,
        // to the end of the list
        customCharacterSort: state.customCharacterSort
          .filter((id) => !order.includes(id))
          .concat(order)
      };

    default:
      return state;
  }
};
