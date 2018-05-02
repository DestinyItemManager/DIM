import { module } from 'angular';

import { SearchFilterComponent } from './search-filter.component';
import { FilterLinkComponent } from './filter-link.component';

export default module('searchModule', [])
  .component('dimSearchFilter', SearchFilterComponent)
  .component('dimFilterLink', FilterLinkComponent)
  .name;
