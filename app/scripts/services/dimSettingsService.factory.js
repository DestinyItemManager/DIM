(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimSettingsService', SettingsService);

  SettingsService.$inject = ['$rootScope', 'SyncService', '$window', '$translate'];

  /**
   * The settings service provides a settings object which contains
   * all DIM settings as properties. To observe changes in settings,
   * add a $watch on one or more of the settings, or just use it in a
   * template (where watches are automatic!). To save settings, call
   * "save()" on the settings object.
   *
   * Settings will start out with default values and asynchronously
   * load in the user's actual settings, so it is a good sidea to
   * always watch the settings you are using.
   */
  function SettingsService($rootScope, SyncService, $window, $translate) {
    var _loaded = false;

    const destinyLanguages = ['de', 'en', 'fr', 'es', 'it', 'ja', 'pt-br'];

    // Try to pick a nice default language
    function defaultLanguage() {
      const browserLang = ($window.navigator.language || 'en').toLowerCase();
      return _.find(destinyLanguages, (lang) => browserLang.startsWith(lang)) || 'en';
    }

    var settings = {
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
      // Show elemental damage icons
      showElements: false,
      // Sort characters (mostRecent, mostRecentReverse, fixed)
      characterOrder: 'mostRecent',
      // Sort items in buckets (primaryStat, rarityThenPrimary,
      // rarity, quality)
      itemSort: 'primaryStat',
      // How many columns to display character buckets
      charCol: 3,
      // How many columns to display vault buckets
      vaultMaxCol: 999,
      // How big in pixels to draw items
      itemSize: 44,
      // Which categories or buckets should be collapsed?
      collapsedSections: {},
      // Predefined item tags. Maybe eventually allow to add more (also i18n?)
      itemTags: [
        { type: undefined, label: 'Tag Item' },
        { type: 'favorite', label: 'Favorite', hotkey: '!', icon: 'star' },
        { type: 'keep', label: 'Keep', hotkey: '@', icon: 'tag' },
        { type: 'junk', label: 'Junk', hotkey: '#', icon: 'ban' },
        { type: 'infuse', label: 'Infuse', hotkey: '$', icon: 'bolt' }
      ],

      language: defaultLanguage(),

      save: function() {
        if (!_loaded) {
          throw new Error("Settings haven't loaded - they can't be saved.");
        }
        $rootScope.$evalAsync(function() {
          SyncService.set({
            'settings-v1.0': _.omit(settings, 'save')
          });
        });
      }
    };

    // Load settings async
    SyncService.get().then(function(data) {
      var savedSettings = data['settings-v1.0'] || {};

      // for now just override itemTags. eventually let users create own?
      savedSettings.itemTags = [
        { type: undefined, label: 'Tag Item' },
        { type: 'favorite', label: 'Favorite', hotkey: '!', icon: 'star' },
        { type: 'keep', label: 'Keep', hotkey: '@', icon: 'tag' },
        { type: 'junk', label: 'Junk', hotkey: '#', icon: 'ban' },
        { type: 'infuse', label: 'Infuse', hotkey: '$', icon: 'bolt' }
      ];

      _loaded = true;
      $rootScope.$evalAsync(function() {
        angular.extend(settings, savedSettings);
        $translate.use(settings.language);
        $translate.fallbackLanguage('en');
      });
    });

    return settings;
  }
})();
