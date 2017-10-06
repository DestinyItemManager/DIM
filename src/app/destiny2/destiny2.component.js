import template from './destiny2.html';
import './destiny2.scss';

/**
 * This is the parent component of all Destiny 2 views.
 */
export const Destiny2Component = {
  template,
  controller: Destiny2Controller
};

function Destiny2Controller(
  $rootScope,
  hotkeys,
  dimSettingsService,
  $scope,
  $i18next
) {
  'ngInject';

  hotkeys = hotkeys.bindTo($scope);

  hotkeys.add({
    combo: ['i'],
    description: $i18next.t('Hotkey.ToggleDetails'),
    callback: function() {
      $rootScope.$broadcast('dim-toggle-item-details');
    }
  });

  if ($featureFlags.tagsEnabled) {
    dimSettingsService.itemTags.forEach((tag) => {
      if (tag.hotkey) {
        hotkeys.add({
          combo: [tag.hotkey],
          description: $i18next.t('Hotkey.MarkItemAs', {
            tag: $i18next.t(tag.label)
          }),
          callback: function() {
            $rootScope.$broadcast('dim-item-tag', { tag: tag.type });
          }
        });
      }
    });
  }
}