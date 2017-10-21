import _ from 'underscore';
import template from './search-filter.html';
import Textcomplete from 'textcomplete/lib/textcomplete';
import Textarea from 'textcomplete/lib/textarea';
import { searchFilters, buildSearchConfig } from './search-filters';
import filtersTemplate from '../search/filters.html';
import './search-filter.scss';

export const SearchFilterComponent = {
  controller: SearchFilterCtrl,
  bindings: {
    destinyVersion: '<'
  },
  template
};

function SearchFilterCtrl(
  $scope, dimStoreService, D2StoresService, dimVendorService, dimSearchService, hotkeys, $i18next, $element, dimCategory, D2Categories, dimSettingsService, toaster, ngDialog) {
  'ngInject';
  const vm = this;
  vm.search = dimSearchService;

  function getStoreService() {
    return vm.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  let filterDefinitions;
  let searchConfig;

  vm.$onChanges = function(changes) {
    if (changes.destinyVersion && changes.destinyVersion) {
      searchConfig = buildSearchConfig(vm.destinyVersion, dimSettingsService.itemTags, vm.destinyVersion === 1 ? dimCategory : D2Categories);
      filterDefinitions = searchFilters(searchConfig, getStoreService(), toaster, $i18next);
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
        match: /\b((li|po|le|qu|pe|ra|is:|not:|tag:|notes:|sta)\w*)$/i,
        search: function(term, callback) {
          callback(this.words.filter((word) => word.startsWith(term.toLowerCase())));
        },
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

  $scope.$on('dim-stores-updated d2-stores-updated dim-vendors-updated dim-filter-invalidate', () => {
    filterDefinitions.reset();
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
    console.log(searchInput);
    searchInput.focus();
  };

  vm.blurFilterInput = function() {
    searchInput.blur();
  };

  vm.clearFilter = function() {
    vm.search.query = "";
    vm.filter();
  };

  vm.filter = function() {
    let filterValue = (vm.search.query) ? vm.search.query.toLowerCase() : '';
    filterValue = filterValue.replace(/\s+and\s+/, ' ');

    // could probably tidy this regex, just a quick hack to support multi term:
    // [^\s]*"[^"]*" -> match is:"stuff here"
    // [^\s]*'[^']*' -> match is:'stuff here'
    // [^\s"']+' -> match is:stuff
    const searchTerms = filterValue.match(/[^\s]*"[^"]*"|[^\s]*'[^']*'|[^\s"']+/g);
    const filters = [];

    function addPredicate(predicate, filter, invert = false) {
      filters.push({ predicate: predicate, value: filter, invert: invert });
    }

    // TODO: replace this if-ladder with a split and check
    _.each(searchTerms, (term) => {
      term = term.replace(/'/g, '').replace(/"/g, '');

      if (term.startsWith('is:')) {
        const filter = term.replace('is:', '');
        const predicate = searchConfig.keywordToFilter[filter];
        if (predicate) {
          addPredicate(predicate, filter);
        }
      } else if (term.startsWith('not:')) {
        const filter = term.replace('not:', '');
        const predicate = searchConfig.keywordToFilter[filter];
        if (predicate) {
          addPredicate(predicate, filter, true);
        }
      } else if (term.startsWith('tag:')) {
        const filter = term.replace('tag:', '');
        addPredicate("itemtags", filter);
      } else if (term.startsWith('notes:')) {
        const filter = term.replace('notes:', '');
        addPredicate("notes", filter);
      } else if (term.startsWith('light:') || term.startsWith('power:')) {
        const filter = term.replace('light:', '').replace('power:', '');
        addPredicate("light", filter);
      } else if (term.startsWith('stack:')) {
        const filter = term.replace('stack:', '');
        addPredicate("stack", filter);
      } else if (term.startsWith('level:')) {
        const filter = term.replace('level:', '');
        addPredicate("level", filter);
      } else if (term.startsWith('quality:') || term.startsWith('percentage:')) {
        const filter = term.replace('quality:', '').replace('percentage:', '');
        addPredicate("quality", filter);
      } else if (term.startsWith('rating:')) {
        const filter = term.replace('rating:', '');
        addPredicate("rating", filter);
      } else if (term.startsWith('ratingcount:')) {
        const filter = term.replace('ratingcount:', '');
        addPredicate("ratingcount", filter);
      } else if (term.startsWith('stat:')) {
        // Avoid console.error by checking if all parameters are typed
        const pieces = term.split(':');
        if (pieces.length === 3) {
          const filter = pieces[1];
          addPredicate(filter, pieces[2]);
        }
      } else if (!/^\s*$/.test(term)) {
        // TODO: not
        addPredicate("keyword", term);
      }
    });

    const filterFn = function(item) {
      return _.all(filters, (filter) => {
        const result = filterDefinitions[filter.predicate](filter.value, item);
        return filter.invert ? !result : result;
      });
    };

    for (const item of getStoreService().getAllItems()) {
      item.visible = (filters.length > 0) ? filterFn(item) : true;
    }

    if (vm.destinyVersion === 1) {
      // Filter vendor items
      _.each(dimVendorService.vendors, (vendor) => {
        for (const saleItem of vendor.allItems) {
          saleItem.item.visible = (filters.length > 0) ? filterFn(saleItem.item) : true;
        }
      });
    }
  };
}
