import * as _ from 'lodash';
import template from './search-filter.html';
import Textcomplete from 'textcomplete/lib/textcomplete';
import Textarea from 'textcomplete/lib/textarea';
import { searchFilters, buildSearchConfig, SearchFilters, SearchConfig } from './search-filters';
import filtersTemplate from '../search/filters.html';
import { getItemInfoSource, itemTags } from '../inventory/dim-item-info';
import './search-filter.scss';
import { IComponentOptions, IController, IScope, IRootElementService } from 'angular';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { DimItem } from '../inventory/item-types';
import { D2StoresService } from '../inventory/d2-stores.service';
import { D1StoresService } from '../inventory/d1-stores.service';
import { dimVendorService } from '../vendors/vendor.service';
import { setSearchQuery } from '../shell/actions';
import store from '../store/store';
import { subscribeOnScope } from '../rx-utils';
import { isPhonePortraitStream } from '../mediaQueries';
import { t } from 'i18next';
import { setItemState as d1SetItemState } from '../bungie-api/destiny1-api';
import { setLockState as d2SetLockState } from '../bungie-api/destiny2-api';
import { toaster, loadingTracker } from '../ngimport-more';

/**
 * A simple holder to share the search query among components
 */
export const SearchService = {
  query: ''
};

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
  hotkeys,
  $i18next,
  $element: IRootElementService,
  ngDialog
) {
  'ngInject';
  const vm = this;
  vm.search = SearchService;
  vm.bulkItemTags = Array.from(itemTags);
  vm.bulkItemTags.shift();
  vm.bulkItemTags.unshift({ label: 'Tags.TagItems' });
  vm.bulkItemTags.push({ type: 'clear', label: 'Tags.ClearTag' });
  vm.bulkItemTags.push({ type: 'lock', label: 'Tags.LockAll' });
  vm.bulkItemTags.push({ type: 'unlock', label: 'Tags.UnlockAll' });

  function getStoresService() {
    return vm.account.destinyVersion === 2 ? D2StoresService : D1StoresService;
  }

  let filters: SearchFilters;
  let filteredItems: DimItem[] = [];

  subscribeOnScope($scope, isPhonePortraitStream(), (isPhonePortrait) => {
    $scope.$apply(() => {
      console.log('isPhonePortrait', isPhonePortrait);
      vm.placeholder = isPhonePortrait
        ? t('Header.FilterHelpBrief')
        : t('Header.FilterHelp', { example: 'is:dupe' });
    });
  });

  vm.$onChanges = (changes) => {
    if (changes.account && changes.account) {
      const searchConfig = buildSearchConfig(vm.account.destinyVersion);
      filters = searchFilters(searchConfig, getStoresService());
      setupTextcomplete(searchConfig);
    }
  };

  let textcomplete: Textcomplete;
  function setupTextcomplete(searchConfig: SearchConfig) {
    if (textcomplete) {
      textcomplete.destroy();
      textcomplete = null;
    }
    const editor = new Textarea($element[0].getElementsByTagName('input')[0]);
    textcomplete = new Textcomplete(editor);
    textcomplete.register(
      [
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
            return word.startsWith('is:') && word.startsWith('not:') ? `${word} ` : word;
          }
        }
      ],
      {
        zIndex: 1000
      }
    );

    textcomplete.on('rendered', () => {
      if (textcomplete.dropdown.items.length) {
        // Activate the first item by default.
        textcomplete.dropdown.items[0].activate();
      }
    });

    $scope.$on('$destroy', () => {
      if (textcomplete) {
        textcomplete.destroy();
        textcomplete = null;
      }
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

  $scope.$on('dim-filter-requery-loadouts', () => {
    vm.filter();
  });

  $scope.$on('dim-filter-invalidate-loadouts', () => {
    filters.resetLoadouts();
    vm.filter();
  });

  hotkeys
    .bindTo($scope)
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

  vm.showFilters = (e) => {
    e.stopPropagation();

    let result;
    if (result) {
      result.close();
    } else {
      ngDialog.closeAll();
      result = ngDialog.open({
        template: filtersTemplate,
        className: 'filters',
        controllerAs: 'vm',
        appendClassName: 'modal-dialog',
        controller() {
          this.destinyVersion = vm.account.destinyVersion;
          this.reviewsEnabled = $featureFlags.reviewsEnabled;
        }
      });

      result.closePromise.then(() => {
        result = null;
      });
    }
  };

  vm.blurFilterInputIfEmpty = () => {
    if (vm.search.query === '') {
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
    vm.search.query = '';
    vm.filter();
    textcomplete.trigger('');
  };

  vm.bulkTag = () => {
    vm.showSelect = false;

    const promise = (async () => {
      if (vm.selectedTag.type === 'lock' || vm.selectedTag.type === 'unlock') {
        // Bulk locking/unlocking

        const state = vm.selectedTag.type === 'lock';
        const lockables = filteredItems.filter((i) => i.lockable);
        try {
          for (const item of lockables) {
            const store =
              item.owner === 'vault'
                ? item.getStoresService().getActiveStore()!
                : item.getStoresService().getStore(item.owner)!;

            if (item.isDestiny2()) {
              await d2SetLockState(store, item, state);
            } else if (item.isDestiny1()) {
              await d1SetItemState(item, store, state, 'lock');
            }

            // TODO: Gotta do this differently in react land
            item.locked = state;
          }
          toaster.pop(
            'success',
            t(state ? 'Filter.LockAllSuccess' : 'Filter.UnlockAllSuccess', {
              num: lockables.length
            })
          );
        } catch (e) {
          toaster.pop(
            'error',
            t(state ? 'Filter.LockAllFailed' : 'Filter.UnlockAllFailed'),
            e.message
          );
        } finally {
          filters.reset();
          vm.filter();
        }
      } else {
        // Bulk tagging
        const itemInfoService = await getItemInfoSource(vm.account);
        await itemInfoService.bulkSave(
          filteredItems.filter((i) => i.taggable).map((item) => {
            item.dimInfo.tag = vm.selectedTag.type === 'clear' ? undefined : vm.selectedTag.type;
            return item;
          })
        );
      }

      $scope.$apply(() => {
        // invalidate and filter
        filters.reset();
        vm.filter();
        vm.showSelect = false;
      });
    })();

    loadingTracker.addPromise(promise);
  };

  vm.filter = () => {
    vm.selectedTag = undefined;
    let filterValue = vm.search.query ? vm.search.query.toLowerCase() : '';
    filterValue = filterValue.replace(/\s+and\s+/, ' ');

    const filterFn = filters.filterFunction(filterValue);

    for (const item of getStoresService().getAllItems()) {
      item.visible = filterFn(item);
    }

    if (vm.account.destinyVersion === 1) {
      // Filter vendor items
      _.each(dimVendorService.vendors, (vendor: any) => {
        for (const saleItem of vendor.allItems) {
          saleItem.item.visible = filterFn(saleItem.item);
        }
      });
    }

    store.dispatch(setSearchQuery(filterValue));
  };
}
