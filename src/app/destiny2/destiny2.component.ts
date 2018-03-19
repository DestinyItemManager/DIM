import { itemTags } from '../settings/settings';
import template from './destiny2.html';
import './destiny2.scss';
import { IComponentOptions, IController, IRootScopeService, IScope } from 'angular';

/**
 * This is the parent component of all Destiny 2 views.
 */
export const Destiny2Component: IComponentOptions = {
  template,
  controller: Destiny2Controller
};

function Destiny2Controller(
  this: IController,
  $rootScope: IRootScopeService,
  hotkeys,
  $scope: IScope,
  $i18next
) {
  'ngInject';

  hotkeys = hotkeys.bindTo($scope);

  hotkeys.add({
    combo: ['i'],
    description: $i18next.t('Hotkey.ToggleDetails'),
    callback() {
      $rootScope.$broadcast('dim-toggle-item-details');
    }
  });

  itemTags.forEach((tag) => {
    if (tag.hotkey) {
      hotkeys.add({
        combo: [tag.hotkey],
        description: $i18next.t('Hotkey.MarkItemAs', {
          tag: $i18next.t(tag.label)
        }),
        callback() {
          $rootScope.$broadcast('dim-item-tag', { tag: tag.type });
        }
      });
    }
  });
}
