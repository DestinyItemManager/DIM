import { merge } from 'angular';
import * as i18next from 'i18next';
import { $rootScope } from 'ngimport';
import * as _ from 'underscore';
import { defaultLanguage } from '../i18n';
import { SyncService } from '../storage/sync.service';

const itemSortPresets = {
  primaryStat: ['primStat', 'name'],
  basePowerThenPrimary: ['basePower', 'primStat', 'name'],
  rarityThenPrimary: ['rarity', 'primStat', 'name'],
  quality: ['rating', 'name'],
  name: ['name'],
  typeThenPrimary: ['typeName', 'classType', 'primStat', 'name'],
  typeThenName: ['typeName', 'classType', 'name']
};

interface TagInfo {
  type?: string;
  label: string;
  hotkey?: string;
  icon?: string;
}

// Predefined item tags. Maybe eventually allow to add more.
export const itemTags: TagInfo[] = [
  { label: 'Tags.TagItem' },
  { type: 'favorite', label: 'Tags.Favorite', hotkey: 'shift+1', icon: 'star' },
  { type: 'keep', label: 'Tags.Keep', hotkey: 'shift+2', icon: 'tag' },
  { type: 'junk', label: 'Tags.Junk', hotkey: 'shift+3', icon: 'ban' },
  { type: 'infuse', label: 'Tags.Infuse', hotkey: 'shift+4', icon: 'bolt' }
];

/**
 * The settings service provides a settings object which contains
 * all DIM settings as properties. To observe changes in settings,
 * add a $watch on one or more of the settings, or just use it in a
 * template (where watches are automatic!). To save settings, call
 * "save()" on the settings object.
 *
 * Settings will start out with default values and asynchronously
 * load in the user's actual settings, so it is a good idea to
 * always watch the settings you are using.
 */

let _loaded = false;
let readyResolve;

export type CharacterOrder = 'mostRecent' | 'mostRecentReverse' | 'fixed';

class Settings {
  // Hide items that don't match the current search
  hideFilteredItems = false;
  // Show full details in item popup
  itemDetails = true;
  // Show item quality percentages
  itemQuality = true;
  // Show new items with an overlay
  showNewItems = false;
  // Show animation of new item overlay on new items
  showNewAnimation = true;
  // Show item reviews
  showReviews = true;
  // Show elemental damage icons
  showElements = false;
  // Can we post identifying information to DTR?
  allowIdPostToDtr = true;
  // Sort characters (mostRecent, mostRecentReverse, fixed)
  characterOrder: CharacterOrder = 'mostRecent';
  // Sort items in buckets (primaryStat, rarityThenPrimary, quality)
  itemSort = 'primaryStat';
  itemSortOrderCustom = Array.from(itemSortPresets.primaryStat);
  // How many columns to display character buckets
  charCol = 3;
  // How many columns to display character buckets on Mobile
  charColMobile = 3;
  // How many columns to display vault buckets
  vaultMaxCol = 999;
  // How big in pixels to draw items - start smaller for iPad
  itemSize = window.matchMedia('(max-width: 1025px)').matches ? 38 : 44;
  // Which categories or buckets should be collapsed?
  collapsedSections = {};
  // What settings for farming mode
  farming = {
    // Whether to keep one slot per item type open
    makeRoomForItems: true,
    moveTokens: false
  };
  // Active destiny version
  destinyVersion = 2;
  reviewsPlatformSelection = 0;

  ready = new Promise((resolve) => readyResolve = resolve);

  language = defaultLanguage();

  colorA11y = '-';

  // TODO: announce settings updated via an observable, meaning it can't be directly observable
  save = _.throttle(() => {
    if (!_loaded) {
      throw new Error("Settings haven't loaded - they can't be saved.");
    }
    SyncService.set({
      'settings-v1.0': _.omit(this, 'save', 'itemSortOrder')
    });
  }, 1000);

  itemSortOrder() {
    return (this.itemSort === 'custom'
      ? this.itemSortOrderCustom
      : itemSortPresets[this.itemSort]) || itemSortPresets.primaryStat;
  }
}

// Settings instance
export const settings = new Settings();

// Load settings async.
// TODO: make this an "init" method instead of whatever this is
export function initSettings() {
  SyncService.get().then((data) => {
    data = data || {};

    const savedSettings = data['settings-v1.0'] || {};
    delete savedSettings.itemTags;

    _loaded = true;
    readyResolve();

    $rootScope.$evalAsync(() => {
      const languageChanged = savedSettings.language !== i18next.language;
      merge(settings, savedSettings);
      localStorage.dimLanguage = settings.language;
      if (languageChanged) {
        i18next.changeLanguage(settings.language, () => {
          $rootScope.$applyAsync(() => {
            $rootScope.$broadcast('i18nextLanguageChange');
          });
        });
      }
      $rootScope.$emit('dim-settings-loaded', {});
    });
  });
}
