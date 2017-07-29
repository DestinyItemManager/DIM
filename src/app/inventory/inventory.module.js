import angular from 'angular';

import inventoryComponent from './inventory.component';
import { RandomLoadoutComponent } from '../loadout/random/random-loadout.component';
import { ClassifiedDataService } from './store/classified-data.service';
import { StoreFactory } from './store/store-factory.service';
import { ItemFactory } from './store/item-factory.service';
import { NewItemsService } from './store/new-items.service';
import { StoreService } from './dimStoreService.factory';
import { StoresComponent } from './dimStores.directive';
import { StoreReputation } from './dimStoreReputation.directive';
import { tagIconFilter, StoreItem } from './dimStoreItem.directive';
import { StoreHeadingComponent } from './dimStoreHeading.directive';
import { StoreBucketComponent } from './dimStoreBucket.directive';
import { StatsComponent } from './dimStats.directive';
import { SimpleItemComponent } from './dimSimpleItem.directive';
import { PercentWidth, percent } from './dimPercentWidth.directive';
import { ItemService } from './dimItemService.factory';
import { ItemMoveService } from './dimItemMoveService.factory';
import { ItemInfoService } from './dimItemInfoService.factory';
import { CsvService } from './dimCsvService.factory';
import { ClearNewItemsComponent } from './dimClearNewItems.directive';

export default angular
  .module('inventoryModule', [])
  .component('inventory', inventoryComponent)
  .component('randomLoadout', RandomLoadoutComponent)
  .factory('dimStoreService', StoreService)
  .factory('ClassifiedDataService', ClassifiedDataService)
  .factory('StoreFactory', StoreFactory)
  .factory('ItemFactory', ItemFactory)
  .factory('NewItemsService', NewItemsService)
  .component('dimStores', StoresComponent)
  .component('dimStoreReputation', StoreReputation)
  .directive('dimStoreItem', StoreItem)
  .filter('tagIcon', tagIconFilter)
  .component('dimStoreHeading', StoreHeadingComponent)
  .component('dimStoreBucket', StoreBucketComponent)
  .component('dimStats', StatsComponent)
  .component('dimSimpleItem', SimpleItemComponent)
  .directive('dimPercentWidth', PercentWidth)
  .filter('percent', () => { return percent; })
  .factory('dimItemService', ItemService)
  .factory('dimItemMoveService', ItemMoveService)
  .factory('dimItemInfoService', ItemInfoService)
  .factory('dimCsvService', CsvService)
  .component('dimClearNewItems', ClearNewItemsComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny1.inventory',
      component: 'inventory',
      url: '/inventory'
    });
  })
  .name;
