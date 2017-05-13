import angular from 'angular';
import template from './item-stats.html';

function ItemStatsController(dimSettingsService, dimFeatureFlags) {
  'ngInject';

  this.settings = dimSettingsService;
  this.featureFlags = dimFeatureFlags;
}

var ItemStatsComponent = {
  bindings: {
    item: '<'
  },
  controller: ItemStatsController,
  template: template
};

angular.module('dimApp')
  .component('dimItemStats', ItemStatsComponent);
