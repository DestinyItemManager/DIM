import angular from 'angular';

import { SearchFilterComponent } from './search-filter.component';
import { FilterLinkComponent } from './filter-link.component';

export default angular
  .module('searchModule', [])
  .component('dimSearchFilter', SearchFilterComponent)
  .component('dimFilterLink', FilterLinkComponent)
  // a simple service to share the search query among components
  .service('dimSearchService', () => {
    return { query: '' };
  })
  .name;