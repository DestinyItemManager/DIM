import angular from 'angular';

import { InventoryComponent } from './inventory.component';
import { ClassifiedDataService } from './store/classified-data.service';
import { StoreFactory } from './store/store-factory.service';
import { D2StoreFactory } from './store/d2-store-factory.service';
import { ItemFactory } from './store/item-factory.service';
import { D2ItemFactory } from './store/d2-item-factory.service';
import { NewItemsService } from './store/new-items.service';
import { StoreService } from './dimStoreService.factory';
import { D2StoresService } from './d2-stores.service';
import { StoresComponent } from './dimStores.directive';
import { StoreReputation } from './dimStoreReputation.directive';
import { tagIconFilter, StoreItemComponent } from './dimStoreItem.directive';
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
import { StorePagerComponent } from './store-pager.component';

export default angular
  .module('inventoryModule', [])
  .factory('dimStoreService', StoreService)
  .factory('D2StoresService', D2StoresService)
  .factory('ClassifiedDataService', ClassifiedDataService)
  .factory('StoreFactory', StoreFactory)
  .factory('D2StoreFactory', D2StoreFactory)
  .factory('ItemFactory', ItemFactory)
  .factory('D2ItemFactory', D2ItemFactory)
  .factory('NewItemsService', NewItemsService)
  .factory('dimItemService', ItemService)
  .factory('dimItemMoveService', ItemMoveService)
  .factory('dimItemInfoService', ItemInfoService)
  .factory('dimCsvService', CsvService)
  .component('inventory', InventoryComponent)
  .component('dimStores', StoresComponent)
  .component('storePager', StorePagerComponent)
  .component('dimStoreReputation', StoreReputation)
  .component('dimStoreHeading', StoreHeadingComponent)
  .component('dimStoreBucket', StoreBucketComponent)
  .component('dimStats', StatsComponent)
  .component('dimSimpleItem', SimpleItemComponent)
  .component('dimClearNewItems', ClearNewItemsComponent)
  .component('dimStoreItem', StoreItemComponent)
  .directive('dimPercentWidth', PercentWidth)
  .filter('tagIcon', tagIconFilter)
  .filter('percent', () => percent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny1.inventory',
      component: 'inventory',
      url: '/inventory'
    });
  })
  .name;
