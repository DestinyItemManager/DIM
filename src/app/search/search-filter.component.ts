import * as _ from 'underscore';
import template from './search-filter.html';
import Textcomplete from 'textcomplete/lib/textcomplete';
import Textarea from 'textcomplete/lib/textarea';
import { searchFilters, buildSearchConfig } from './search-filters';
import filtersTemplate from '../search/filters.html';
import { D2Categories } from '../destiny2/d2-buckets.service';
import { D1Categories } from '../destiny1/d1-buckets.service';
import { itemTags } from '../settings/settings';
import { getItemInfoSource } from '../inventory/dim-item-info';
import './search-filter.scss';
import { IComponentOptions, IController, IScope, IRootElementService } from 'angular';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { DimItem } from '../inventory/store/d2-item-factory.service';

export const SearchFilterComponent: IComponentOptions = {
  controller: SearchFilterCtrl,
  bindings: {
    account: '<'
  },
  template
};

function SearchFilterCtrl(
  this: IController & {
    account: DestinyAccount;
  },
  $scope: IScope,
  dimStoreService: StoreServiceType,
  D2StoresService: StoreServiceType,
  dimSearchService,
  hotkeys,
  $i18next,
  $element: IRootElementService,
  toaster,
  ngDialog,
  $injector,
  $transitions
) {
  'ngInject';
  const vm = this;
  vm.search = dimSearchService;
  vm.bulkItemTags = _.clone(itemTags);
  vm.bulkItemTags.push({ type: 'clear', label: 'Tags.ClearTag' });

  function getStoreService() {
    return vm.account.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  // This hacks around the fact that dimVendorService isn't defined until the destiny1 modules are lazy-loaded
  let dimVendorService;
  const unregisterTransitionHook = $transitions.onSuccess({ to: 'destiny1.*' }, () => {
    if (!dimVendorService) {
      dimVendorService = $injector.get('dimVendorService');
    }
  });

  vm.$onDestroy = () => {
    unregisterTransitionHook();
  };

  let filters;
  let searchConfig;
  let filteredItems: DimItem[] = [];

  vm.$onChanges = (changes) => {
    if (changes.account && changes.account) {
      searchConfig = buildSearchConfig(
        vm.account.destinyVersion,
        itemTags,
        vm.account.destinyVersion === 1 ? D1Categories : D2Categories);
      filters = searchFilters(searchConfig, getStoreService(), toaster, $i18next);
      setupTextcomplete();
    }
  };

  let textcomplete;
  function setupTextcomplete() {
    if (textcomplete) {
      textcomplete.destroy();
      textcomplete = null;
    }
    const editor = new Textarea($element[0].getElementsByTagName('input')[0]);
    textcomplete = new Textcomplete(editor);
    textcomplete.register([
      {
        words: searchConfig.keywords,
        match: /\b([\w:]{3,})$/i,
        search(term, callback) {
          if (term) {
            let words = this.words.filter((word: string) => word.includes(term.toLowerCase()));
            words = _.sortBy(words, (word: string) => word.indexOf(term.toLowerCase()));
            if (term.match(/\b((is:|not:|tag:|notes:|stat:)\w*)$/i)) {
              callback(words);
            } else if (words.length) {
              callback([term, ...words]);
            } else {
              callback([]);
            }
          }
        },
        // TODO: use "template" to include help text
        index: 1,
        replace(word) {
          word = word.toLowerCase();
          return (word.startsWith('is:') && word.startsWith('not:'))
            ? `${word} ` : word;
        }
      }
    ], {
      zIndex: 1000
    });

    textcomplete.on('rendered', () => {
      if (textcomplete.dropdown.items.length) {
        // Activate the first item by default.
        textcomplete.dropdown.items[0].activate();
      }
    });

    $scope.$on('$destroy', () => {
      textcomplete.destroy();
    });
  }

  let searchInput;
  vm.$postLink = () => {
    searchInput = $element[0].getElementsByTagName('input')[0];
  };

  $scope.$watch('$ctrl.search.query', () => {
    vm.filter();
  });

  $scope.$on('dim-filter-invalidate', () => {
    filters.reset();
    vm.filter();
  });

  hotkeys.bindTo($scope)
    .add({
      combo: ['f'],
      description: $i18next.t('Hotkey.StartSearch'),
      callback: (event) => {
        vm.focusFilterInput();
        event.preventDefault();
        event.stopPropagation();
      }
    })
    .add({
      combo: ['shift+f'],
      description: $i18next.t('Hotkey.StartSearchClear'),
      callback: (event) => {
        vm.clearFilter();
        vm.focusFilterInput();
        event.preventDefault();
        event.stopPropagation();
      }
    })
    .add({
      combo: ['esc'],
      allowIn: ['INPUT'],
      callback: () => {
        vm.blurFilterInputIfEmpty();
        vm.clearFilter();
      }
    });

  vm.showFilters = showPopup('filters', filtersTemplate);

  /**
   * Show a popup dialog containing the given template. Its class
   * will be based on the name.
   */
  function showPopup(name, template) {
    let result;
    return (e) => {
      e.stopPropagation();

      if (result) {
        result.close();
      } else {
        ngDialog.closeAll();
        result = ngDialog.open({
          template,
          className: name,
          appendClassName: 'modal-dialog'
        });

        result.closePromise.then(() => {
          result = null;
        });
      }
    };
  }

  vm.blurFilterInputIfEmpty = () => {
    if (vm.search.query === "") {
      vm.blurFilterInput();
    }
  };

  vm.focusFilterInput = () => {
    searchInput.focus();
  };

  vm.blurFilterInput = () => {
    searchInput.blur();
  };

  vm.clearFilter = () => {
    filteredItems = [];
    vm.search.query = "";
    vm.filter();
    textcomplete.trigger('');
  };

  vm.bulkTag = () => {
    getItemInfoSource(vm.account).then((itemInfoService) => {
      itemInfoService.bulkSave(filteredItems.filter((i) => i.taggable).map((item) => {
        item.dimInfo.tag = vm.selectedTag.type === 'clear' ? undefined : vm.selectedTag.type;
        return item;
      }));

      // invalidate and filter
      filters.reset();
      vm.filter();
      vm.showSelect = false;
    });
  };

  vm.filter = () => {
    vm.selectedTag = undefined;
    filteredItems = [];
    let filterValue = (vm.search.query) ? vm.search.query.toLowerCase() : '';
    filterValue = filterValue.replace(/\s+and\s+/, ' ');

    const filterFn = filters.filterFunction(filterValue);

    for (const item of getStoreService().getAllItems()) {
      item.visible = filterFn(item);
      if (item.visible) {
        filteredItems.push(item);
      }
    }

    if (vm.account.destinyVersion === 1 && dimVendorService) {
      // Filter vendor items
      _.each(dimVendorService.vendors, (vendor: any) => {
        for (const saleItem of vendor.allItems) {
          saleItem.item.visible = filterFn(saleItem.item);
        }
      });
    }
  };
}
