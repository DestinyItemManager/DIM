import angular from 'angular';
import template from './d2farming.html';
import './farming.scss';

export const D2FarmingComponent = {
  controller: FarmingCtrl,
  controllerAs: 'vm',
  template
};

function FarmingCtrl(D2FarmingService, dimSettingsService) {
  'ngInject';

  const vm = this;

  angular.extend(vm, {
    service: D2FarmingService,
    settings: dimSettingsService,
    stop: function($event) {
      $event.preventDefault();
      D2FarmingService.stop();
    }
  });
}
