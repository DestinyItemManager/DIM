import angular from 'angular';
import _ from 'underscore';
import i18next, { changeLanguage } from 'i18next';
import { defaultLanguage } from '../i18n';

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
export function SettingsService($rootScope, SyncService, $window, $i18next, $q) {
  'ngInject';

  let _loaded = false;
  const _ready = $q.defer();

  const settings = {
    // Hide items that don't match the current search
    hideFilteredItems: false,
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
    // How many columns to display character buckets
    charCol: 3,
    // How many columns to display vault buckets
    vaultMaxCol: 999,
    // How big in pixels to draw items - start smaller for iPad
    itemSize: window.matchMedia('(max-width: 1025px)').matches ? 38 : 44,
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
    reviewsPlatformSelection: 0,

    // Predefined item tags. Maybe eventually allow to add more (also i18n?)
    itemTags: [
      { type: undefined, label: 'Tags.TagItem' },
      { type: 'favorite', label: 'Tags.Favorite', hotkey: '!', icon: 'star' },
      { type: 'keep', label: 'Tags.Keep', hotkey: '@', icon: 'tag' },
      { type: 'junk', label: 'Tags.Junk', hotkey: '#', icon: 'ban' },
      { type: 'infuse', label: 'Tags.Infuse', hotkey: '$', icon: 'bolt' }
    ],

    language: defaultLanguage(),

    colorA11y: '-',

    save: _.throttle(() => {
      if (!_loaded) {
        throw new Error("Settings haven't loaded - they can't be saved.");
      }
      SyncService.set({
        'settings-v1.0': _.omit(settings, 'save', 'itemTags')
      });
    }, 1000),

    ready: _ready.promise
  };

  // Load settings async
  SyncService.get().then((data) => {
    data = data || {};

    const savedSettings = data['settings-v1.0'] || {};

    // for now just override itemTags. eventually let users create own?
    savedSettings.itemTags = [
      { type: undefined, label: 'Tags.TagItem' },
      { type: 'favorite', label: 'Tags.Favorite', hotkey: '!', icon: 'star' },
      { type: 'keep', label: 'Tags.Keep', hotkey: '@', icon: 'tag' },
      { type: 'junk', label: 'Tags.Junk', hotkey: '#', icon: 'ban' },
      { type: 'infuse', label: 'Tags.Infuse', hotkey: '$', icon: 'bolt' }
    ];

    _loaded = true;
    _ready.resolve();

    $rootScope.$evalAsync(() => {
      const languageChanged = savedSettings.language !== i18next.language;
      angular.merge(settings, savedSettings);
      localStorage.dimLanguage = settings.language;
      if (languageChanged) {
        changeLanguage(settings.language, () => {
          $rootScope.$applyAsync(() => {
            $rootScope.$broadcast('i18nextLanguageChange');
          });
        });
      }
      $rootScope.$emit('dim-settings-loaded', {});
    });
  });

  return settings;
}

