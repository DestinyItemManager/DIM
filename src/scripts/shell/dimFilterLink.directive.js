import angular from 'angular';
import template from './dimFilterLink.directive.html';

/**
 * Link to a specific filter in search. Clicking adds this term to the search.
 * Example: <dim-filter-link filter="is:arc"></dim-filter-link>
 */
angular.module('dimApp')
  .component('dimFilterLink', {
    template: template,
    controller: FilterLinkCtrl,
    bindings: {
      filter: '@'
    }
  });

function FilterLinkCtrl(dimSearchService, $window, $translate) {
  this.addFilter = function(filter) {
    let itemNameFilter = false;

    if (filter === 'item name') {
      itemNameFilter = true;
      filter = $window.prompt($translate.instant('Filter.EnterName'));
      filter = filter.trim();
    }

    if (filter === 'notes:value') {
      itemNameFilter = true;
      filter = $window.prompt($translate.instant('Filter.EnterNote'));
      filter = `notes:"${filter.trim()}"`;
    }

    if (filter.indexOf('light:') === 0 || filter.indexOf('quality:') === 0) {
      const type = filter.split(':');
      const lightFilterType = type[1];
      let light = $window.prompt(`Enter a ${type[0]} value:`);
      if (light) {
        light = light.trim();
      } else {
        return;
      }
      filter = `${type[0]}:`;
      switch (lightFilterType) {
      case 'value':
        filter += light;
        break;
      case '>value':
        filter += `>${light}`;
        break;
      case '>=value':
        filter += `>=${light}`;
        break;
      case '<value':
        filter += `<${light}`;
        break;
      case '<=value':
        filter += `<=${light}`;
        break;
      default:
        filter = '';
        break;
      }
    }

    const text = dimSearchService.query;

    if (itemNameFilter) {
      dimSearchService.query = filter + (text.length ? ` ${text}` : '');
    } else if ((`${text} `).indexOf(`${filter} `) < 0) {
      if (text.length > 0) {
        dimSearchService.query = `${text} ${filter}`;
      } else {
        dimSearchService.query = filter;
      }
    }
  };
}
