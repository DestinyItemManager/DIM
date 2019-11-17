import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import _ from 'lodash';
import { defaultLanguage } from '../i18n';
import { DtrD2ActivityModes } from '../item-review/d2-dtr-api-types';
import { InfuseDirection } from '../infuse/infuse-direction';
import { DtrReviewPlatform } from 'app/destinyTrackerApi/platformOptionsFetcher';

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
  /**
   * Sort items in buckets (primaryStat, rarityThenPrimary, quality).
   * This used to let you set a preset but now it's always "custom"
   * unless loaded from an older settings.
   */
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
  /** Hide triumphs once they're completed */
  readonly completedRecordsHidden: boolean;
  /** Hide show triumphs the manifest recommends be redacted */
  readonly redactedRecordsRevealed: boolean;
  /** What settings for farming mode */
  readonly farming: {
    /** Whether to keep one slot per item type open */
    readonly makeRoomForItems: boolean;
    readonly moveTokens: boolean;
  };
  /** Destiny 2 platform selection for ratings + reviews */
  readonly reviewsPlatformSelectionV2: DtrReviewPlatform;
  /** Destiny 2 play mode selection for ratings + reviews - see DestinyActivityModeType for values */
  readonly reviewsModeSelection: DtrD2ActivityModes;

  /** Hide completed Destiny 1 records */
  readonly hideCompletedRecords: boolean;

  /** Custom character sort - across all accounts and characters! */
  readonly customCharacterSort: string[];

  /** The last direction the infusion fuel finder was set to. */
  readonly infusionDirection: InfuseDirection;

  /** Whether the item picker should equip or store. */
  readonly itemPickerEquip: boolean;

  /** The user's preferred language. */
  readonly language: string;

  /** Colorblind modes. */
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
  itemSort: 'custom',
  itemSortOrderCustom: ['primStat', 'name'],
  // How many columns to display character buckets
  charCol: 3,
  // How many columns to display character buckets on Mobile
  charColMobile: 4,
  // How big in pixels to draw items - start smaller for iPad
  itemSize: defaultItemSize(),
  // Which categories or buckets should be collapsed?
  collapsedSections: {},
  // Hide triumphs once they're completed
  completedRecordsHidden: false,
  // Hide show triumphs the manifest recommends be redacted
  redactedRecordsRevealed: false,

  // What settings for farming mode
  farming: {
    // Whether to keep one slot per item type open
    makeRoomForItems: true,
    moveTokens: false
  },
  // Destiny 2 platform selection for ratings + reviews
  reviewsPlatformSelectionV2: 0,
  // Destiny 2 play mode selection for ratings + reviews - see DestinyActivityModeType for values
  reviewsModeSelection: DtrD2ActivityModes.notSpecified,
  hideCompletedRecords: false,

  customCharacterSort: [],

  infusionDirection: InfuseDirection.INFUSE,
  itemPickerEquip: true,

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

    case getType(actions.setCharacterOrder): {
      const order = action.payload;
      return {
        ...state,
        // Remove these characters from the list and add them, in the new sort order,
        // to the end of the list
        customCharacterSort: state.customCharacterSort
          .filter((id) => !order.includes(id))
          .concat(order)
      };
    }

    default:
      return state;
  }
};
