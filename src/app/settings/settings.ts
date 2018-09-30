import i18next from 'i18next';
import { $rootScope } from 'ngimport';
import * as _ from 'underscore';
import { SyncService } from '../storage/sync.service';
import store from '../store/store';
import { loaded } from './actions';
import { observeStore } from '../redux-utils';
import { Unsubscribe } from 'redux';
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
  /** Active destiny version */
  readonly destinyVersion: 2;
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
  itemSortOrderCustom: [],
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
  // Active destiny version
  destinyVersion: 2,
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

let readyResolve;
export const settingsReady = new Promise((resolve) => (readyResolve = resolve));

// This is a backwards-compatibility shim for all the code that directly uses settings
export let settings: Settings;

const saveSettings = _.throttle((settings) => {
  return SyncService.set({
    'settings-v1.0': settings
  });
}, 1000);

function saveSettingsOnUpdate() {
  return observeStore(
    (state) => state.settings,
    (_currentState, nextState) => {
      settings = nextState;
      saveSettings(nextState);
    }
  );
}

let unsubscribe: Unsubscribe;

// Load settings async.
export function initSettings() {
  if (unsubscribe) {
    // Stop saving settings changes
    unsubscribe();
  }

  SyncService.get().then((data) => {
    data = data || {};

    const savedSettings = (data['settings-v1.0'] || {}) as Partial<Settings>;

    $rootScope.$evalAsync(() => {
      const languageChanged = savedSettings.language !== i18next.language;
      store.dispatch(loaded(savedSettings));
      const settings = store.getState().settings;
      localStorage.setItem('dimLanguage', settings.language);
      if (languageChanged) {
        i18next.changeLanguage(settings.language, () => {
          $rootScope.$applyAsync(() => {
            $rootScope.$broadcast('i18nextLanguageChange');
          });
        });
      }
    });

    readyResolve();
    // Start saving settings changes
    unsubscribe = saveSettingsOnUpdate();
  });
}
