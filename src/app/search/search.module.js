import angular from 'angular';

import { SearchFilterComponent } from './search-filter.component';

export default angular
  .module('searchModule', [])
  .component('dimSearchFilter', SearchFilterComponent)
  // a simple service to share the search query among components
  .service('dimSearchService', () => {
    return { query: '' };
  })
  .name;