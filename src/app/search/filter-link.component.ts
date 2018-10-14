import template from './filter-link.html';
import { IController, IWindowService, IComponentOptions } from 'angular';
import { querySelector } from '../shell/reducer';
import store from '../store/store';
import { setSearchQuery } from '../shell/actions';

/**
 * Link to a specific filter in search. Clicking adds this term to the search.
 * Example: <dim-filter-link filter="is:arc"></dim-filter-link>
 */
export const FilterLinkComponent: IComponentOptions = {
  template,
  controller: FilterLinkCtrl,
  bindings: {
    filter: '@'
  }
};

function FilterLinkCtrl(this: IController, $window: IWindowService, $i18next) {
  'ngInject';

  this.addFilter = (filter: string) => {
    let itemNameFilter = false;

    if (filter === 'item name') {
      itemNameFilter = true;
      filter = $window.prompt($i18next.t('Filter.EnterName')) || '';
      filter = filter.trim();
    }

    if (filter === 'notes:value') {
      itemNameFilter = true;
      filter = $window.prompt($i18next.t('Filter.EnterNote')) || '';
      filter = `notes:"${filter.trim()}"`;
    }

    if (
      filter.indexOf('light:') === 0 ||
      filter.indexOf('quality:') === 0 ||
      filter.indexOf('stack:') === 0
    ) {
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

    let query = querySelector(store.getState());

    if (itemNameFilter) {
      query = filter + (query.length ? ` ${query}` : '');
    } else if (`${query} `.indexOf(`${filter} `) < 0) {
      query = query.length > 0 ? `${query} ${filter}` : filter;
    }

    store.dispatch(setSearchQuery(query));
  };
}
