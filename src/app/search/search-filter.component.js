import _ from 'underscore';
import template from './search-filter.html';
import Textcomplete from 'textcomplete/lib/textcomplete';
import Textarea from 'textcomplete/lib/textarea';
import { searchFilters, buildSearchConfig } from './search-filters';
import filtersTemplate from '../search/filters.html';
import { D2Categories } from '../destiny2/d2-buckets.service';
import './search-filter.scss';

export const SearchFilterComponent = {
  controller: SearchFilterCtrl,
  bindings: {
    destinyVersion: '<'
  },
  template
};

function SearchFilterCtrl(
  $scope, dimStoreService, D2StoresService, dimSearchService, dimItemInfoService, hotkeys, $i18next, $element, dimCategory, dimSettingsService, toaster, ngDialog, $stateParams, $injector, $transitions) {
  'ngInject';
  const vm = this;
  vm.search = dimSearchService;
  vm.bulkItemTags = _.clone(dimSettingsService.itemTags);
  vm.bulkItemTags.push({ type: 'clear', label: 'Tags.ClearTag' });

  function getStoreService() {
    return vm.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  // This hacks around the fact that dimVendorService isn't defined until the destiny1 modules are lazy-loaded
  let dimVendorService;
  const unregisterTransitionHook = $transitions.onSuccess({ to: 'destiny1.*' }, (transition) => {
    if (!dimVendorService) {
      dimVendorService = $injector.get('dimVendorService');
    }
  });

  vm.$onDestroy = function() {
    unregisterTransitionHook();
  }

  let filters;
  let searchConfig;
  let filteredItems = [];

  vm.$onChanges = function(changes) {
    if (changes.destinyVersion && changes.destinyVersion) {
      searchConfig = buildSearchConfig(vm.destinyVersion, dimSettingsService.itemTags, vm.destinyVersion === 1 ? dimCategory : D2Categories);
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
        search: function(term, callback) {
          if (term) {
            let words = this.words.filter((word) => word.includes(term.toLowerCase()));
            words = _.sortBy(words, (word) => word.indexOf(term.toLowerCase()));
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
        replace: function(word) {
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
  vm.$postLink = function() {
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
      callback: function(event) {
        vm.focusFilterInput();
        event.preventDefault();
        event.stopPropagation();
      }
    })
    .add({
      combo: ['shift+f'],
      description: $i18next.t('Hotkey.StartSearchClear'),
      callback: function(event) {
        vm.clearFilter();
        vm.focusFilterInput();
        event.preventDefault();
        event.stopPropagation();
      }
    })
    .add({
      combo: ['esc'],
      allowIn: ['INPUT'],
      callback: function() {
        vm.blurFilterInputIfEmpty();
        vm.clearFilter();
      }
    });

  vm.showFilters = showPopupFunction('filters', filtersTemplate);

  /**
   * Show a popup dialog containing the given template. Its class
   * will be based on the name.
   */
  function showPopupFunction(name, template) {
    let result;
    return function(e) {
      e.stopPropagation();

      if (result) {
        result.close();
      } else {
        ngDialog.closeAll();
        result = ngDialog.open({
          template: template,
          className: name,
          appendClassName: 'modal-dialog'
        });

        result.closePromise.then(() => {
          result = null;
        });
      }
    };
  }

  vm.blurFilterInputIfEmpty = function() {
    if (vm.search.query === "") {
      vm.blurFilterInput();
    }
  };

  vm.focusFilterInput = function() {
    searchInput.focus();
  };

  vm.blurFilterInput = function() {
    searchInput.blur();
  };

  vm.clearFilter = function() {
    filteredItems = [];
    vm.search.query = "";
    vm.filter();
    textcomplete.trigger('');
  };

  vm.bulkTag = function() {
    dimItemInfoService({
      membershipId: $stateParams.membershipId,
      platformType: $stateParams.platformType
    }, filteredItems[0].destinyVersion).then((itemInfoService) => {
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

  vm.filter = function() {
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

    if (vm.destinyVersion === 1 && dimVendorService) {
      // Filter vendor items
      _.each(dimVendorService.vendors, (vendor) => {
        for (const saleItem of vendor.allItems) {
          saleItem.item.visible = filterFn(saleItem.item);
        }
      });
    }
  };
}
