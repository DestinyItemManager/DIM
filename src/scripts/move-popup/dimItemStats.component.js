import angular from 'angular';
import template from './item-stats.html';

function ItemStatsController(dimSettingsService) {
  'ngInject';

  this.settings = dimSettingsService;
  this.qualityEnabled = $featureFlags.qualityEnabled;
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
