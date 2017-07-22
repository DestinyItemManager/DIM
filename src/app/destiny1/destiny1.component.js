import _ from 'underscore';

import template from './destiny1.html';

/**
 * This is the parent component of all Destiny 1 views.
 */
export const Destiny1Component = {
  controller: Destiny1Controller,
  template
};

// This is outside the class in order to make it a truly global
// fire-once function, so no matter how many times they visit this
// page, they'll only see the popup once per session.
const showExtensionDeprecation = _.once(($i18next, dimInfoService) => {
  dimInfoService.show('extension-deprecated', {
    title: $i18next.t('Help.ExtensionDeprecatedTitle'),
    body: $i18next.t('Help.ExtensionDeprecatedMessage'),
    type: 'info'
  }, 0);
});

function Destiny1Controller(
  $rootScope,
  hotkeys,
  dimSettingsService,
  $scope,
  $i18next,
  dimInfoService
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

  // An abbreviated version of the messager from storage.component.js,
  // just so we can send an info popup.
  function messageHandler(event) {
    // We only accept messages from ourselves
    if (event.source !== window) {
      return;
    }

    switch (event.data.type) {
    case 'DIM_EXT_PONG':
      showExtensionDeprecation($i18next, dimInfoService);
      break;
    }
  }

  window.addEventListener('message', messageHandler, false);
  window.postMessage({ type: 'DIM_EXT_PING' }, "*");

  $scope.$on('$destroy', () => {
    window.removeEventListener('message', messageHandler);
  });
}
