(function() {
  'use strict';

  /**
   * Link to a specific filter in search. Clicking adds this term to the search.
   * Example: <dim-filter-link filter="is:arc"></dim-filter-link>
   */
  angular.module('dimApp')
    .component('dimFilterLink', {
      template: "<span ng-click='$ctrl.addFilter($ctrl.filter)' ng-bind='$ctrl.filter'></span>",
      controller: FilterLinkCtrl,
      bindings: {
        filter: '@'
      }
    });

  FilterLinkCtrl.$inject = ['dimSearchService', '$window'];
  function FilterLinkCtrl(dimSearchService, $window) {
    this.addFilter = function(filter) {
      var itemNameFilter = false;

      if (filter === 'item name') {
        itemNameFilter = true;
        filter = $window.prompt("Enter an item name:");
        filter = filter.trim();
      }

      if (filter.indexOf('light:') === 0) {
        var lightFilterType = filter.substring(6);
        var light = $window.prompt("Enter a light value:");
        if (light) {
          light = light.trim();
        } else {
          return;
        }
        filter = 'light:';
        switch (lightFilterType) {
        case 'value':
          filter += light;
          break;
        case '>value':
          filter += '>' + light;
          break;
        case '>=value':
          filter += '>=' + light;
          break;
        case '<value':
          filter += '<' + light;
          break;
        case '<=value':
          filter += '<=' + light;
          break;
        default:
          filter = '';
          break;
        }
      }

      var text = dimSearchService.query;

      if (itemNameFilter) {
        dimSearchService.query = filter + (text.length ? ' ' + text : '');
      } else if ((text + ' ').indexOf(filter + ' ') < 0) {
        if (text.length > 0) {
          dimSearchService.query = text + ' ' + filter;
        } else {
          dimSearchService.query = filter;
        }
      }
    };
  }
})();
