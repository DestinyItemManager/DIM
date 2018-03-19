import angular from 'angular';

import { SearchFilterComponent } from './search-filter.component';
import { FilterLinkComponent } from './filter-link.component';

// a simple service to share the search query among components
function SearchService() {
  return { query: '' };
}

export default angular
  .module('searchModule', [])
  .component('dimSearchFilter', SearchFilterComponent)
  .component('dimFilterLink', FilterLinkComponent)
  .service('dimSearchService', SearchService)
  .name;