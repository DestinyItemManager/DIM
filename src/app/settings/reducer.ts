import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import * as _ from 'lodash';
import { defaultLanguage } from '../i18n';
import { DtrD2ActivityModes } from '../item-review/d2-dtr-api-types';

export type CharacterOrder = 'mostRecent' | 'mostRecentReverse' | 'fixed' | 'custom';

export interface Settings {
  /** Show full details in item popup */
  readonly itemDetails: boolean;
  /** Show item quality percentages */
  readonly itemQuality: boolean;
  /** Show new items with an overlay */
  readonly showNewItems: boolean;
  /** Show item reviews */
  readonly showReviews: boolean;
  /** Can we post identifying information to DTR? */
  readonly allowIdPostToDtr: boolean;
  /** Sort characters (mostRecent, mostRecentReverse, fixed) */
  readonly characterOrder: CharacterOrder;
  /** Sort items in buckets (primaryStat, rarityThenPrimary, quality) */
  readonly itemSort: string;
  readonly itemSortOrderCustom: string[];
  /** How many columns to display character buckets */
  readonly charCol: number;
  /** How many columns to display character buckets on Mobile */
  readonly charColMobile: number;
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
  readonly reviewsPlatformSelection: number;
  /** Destiny 2 play mode selection for ratings + reviews - see DestinyActivityModeType for values */
  readonly reviewsModeSelection: DtrD2ActivityModes;

  /** Hide completed Destiny 1 records */
  readonly hideCompletedRecords: boolean;

  /** Custom character sort - across all accounts and characters! */
  readonly customCharacterSort: string[];

  readonly language: string;

  readonly colorA11y: string;
}

export function defaultItemSize() {
  return 50;
}

export const initialState: Settings = {
  // Show full details in item popup
  itemDetails: true,
  // Show item quality percentages
  itemQuality: true,
  // Show new items with a red dot
  showNewItems: false,
  // Show item reviews
  showReviews: true,
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
  charColMobile: 4,
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
  reviewsModeSelection: DtrD2ActivityModes.notSpecified,
  hideCompletedRecords: false,

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

    case getType(actions.setFarmingSetting):
      if (state.farming[action.payload.property] !== action.payload.value) {
        return {
          ...state,
          farming: {
            ...state.farming,
            [action.payload.property]: action.payload.value
          }
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
