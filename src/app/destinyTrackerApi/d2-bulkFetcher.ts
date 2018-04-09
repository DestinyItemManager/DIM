import { D2ItemListBuilder } from './d2-itemListBuilder';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { DtrBulkItem, DtrItem } from '../item-review/destiny-tracker.service';
import { D2ReviewDataCache } from './d2-reviewDataCache';
import { IPromise } from 'angular';
import { $q, $http } from 'ngimport';
import { D2TrackerErrorHandler } from './d2-trackerErrorHandler';
import { DestinyVendorSaleItemComponent, DestinyVendorItemDefinition } from 'bungie-api-ts/destiny2';

class D2BulkFetcher {
  _reviewDataCache: D2ReviewDataCache;
  _loadingTracker: any;
  _trackerErrorHandler: D2TrackerErrorHandler;
  _itemListBuilder: D2ItemListBuilder;

  constructor(loadingTracker, reviewDataCache) {
    this._trackerErrorHandler = new D2TrackerErrorHandler();
    this._itemListBuilder = new D2ItemListBuilder();
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = reviewDataCache;
  }

  _getBulkWeaponDataEndpointPost(itemList: DtrItem[], platformSelection: number, mode: number) {
    return {
      method: 'POST',
      url: `https://db-api.destinytracker.com/api/external/reviews/fetch?platform=${platformSelection}&mode=${mode}`,
      data: itemList,
      dataType: 'json'
    };
  }

  _getBulkFetchPromise(stores: DimStore[], platformSelection: number, mode: number): IPromise<DtrBulkItem[]> {
    if (!stores.length) {
      const emptyVotes: DtrBulkItem[] = [];
      return $q.resolve(emptyVotes);
    }

    const itemList = this._itemListBuilder.getItemList(stores, this._reviewDataCache);

    if (!itemList.length) {
      const emptyVotes: DtrBulkItem[] = [];
      return $q.resolve(emptyVotes);
    }

    const promise = $q
      .when(this._getBulkWeaponDataEndpointPost(itemList, platformSelection, mode))
      .then($http)
      .then(this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler), this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler))
      .then((response) => response.data);

    this._loadingTracker.addPromise(promise);

    return promise as IPromise<DtrBulkItem[]>;
  }

  _getVendorBulkFetchPromise(platformSelection: number,
                             mode: number,
                             vendorSaleItems?: DestinyVendorSaleItemComponent[],
                             vendorItems?: DestinyVendorItemDefinition[]): IPromise<DtrBulkItem[]> {
    if ((vendorSaleItems && !vendorSaleItems.length) || (vendorItems && !vendorItems.length)) {
      const emptyVotes: DtrBulkItem[] = [];
      return $q.resolve(emptyVotes);
    }

    const vendorDtrItems = this._itemListBuilder.getVendorItemList(this._reviewDataCache, vendorSaleItems, vendorItems);

    if (!vendorDtrItems.length) {
      const emptyVotes: DtrBulkItem[] = [];
      return $q.resolve(emptyVotes);
    }

    const promise = $q
      .when(this._getBulkWeaponDataEndpointPost(vendorDtrItems, platformSelection, mode))
      .then($http)
      .then(this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler), this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler))
      .then((response) => response.data);

    this._loadingTracker.addPromise(promise);

    return promise as IPromise<DtrBulkItem[]>;
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied stores.
   */
  bulkFetch(stores: DimStore[], platformSelection: number, mode: number) {
    this._getBulkFetchPromise(stores, platformSelection, mode)
      .then((bulkRankings) => this.attachRankings(bulkRankings,
                                                  stores));
  }

  _addScores(bulkRankings: DtrBulkItem[] | null): void {
    this._reviewDataCache.addScores(bulkRankings);
  }

  getCache(): D2ReviewDataCache {
    return this._reviewDataCache;
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied vendors.
   */
  bulkFetchVendorItems(platformSelection: number,
                       mode: number,
                       vendorSaleItems?: DestinyVendorSaleItemComponent[],
                       vendorItems?: DestinyVendorItemDefinition[]): IPromise<void> {
    return this._getVendorBulkFetchPromise(platformSelection, mode, vendorSaleItems, vendorItems)
      .then((bulkRankings) => this._addScores(bulkRankings));
  }

  attachRankings(bulkRankings: DtrBulkItem[] | null,
                 stores: DimStore[]): void {
    if (!bulkRankings && !stores) {
      return;
    }

    this._addScores(bulkRankings);

    stores.forEach((store) => {
      store.items.forEach((storeItem) => {
        if (storeItem.reviewable) {
          const matchingItem = this._reviewDataCache.getRatingData(storeItem);

          if (matchingItem) {
            storeItem.dtrRating = matchingItem.rating;
            storeItem.dtrRatingCount = matchingItem.votes.total;
            storeItem.dtrHighlightedRatingCount = matchingItem.highlightedRatingCount;
            storeItem.userVote = matchingItem.userVote;
            storeItem.userReview = matchingItem.text;
            storeItem.pros = matchingItem.pros;
            storeItem.cons = matchingItem.cons;
          }
        }
      });
    });
  }

  attachVendorRankings(bulkRankings,
                       vendors): void {
    if (!bulkRankings && !vendors) {
      return;
    }

    if (bulkRankings) {
      this._reviewDataCache.addScores(bulkRankings);
    }

    vendors.forEach((vendor) => {
      vendor.allItems.forEach((vendorItemContainer) => {
        const vendorItem = vendorItemContainer.item;

        const matchingItem = this._reviewDataCache.getRatingData(vendorItem);

        if (matchingItem) {
          vendorItem.dtrRating = matchingItem.rating;
          vendorItem.dtrRatingCount = matchingItem.totalReviews;
          vendorItem.dtrHighlightedRatingCount = matchingItem.highlightedRatingCount;
          vendorItem.userRating = matchingItem.userRating;
          vendorItem.userReview = matchingItem.review;
          vendorItem.pros = matchingItem.pros;
          vendorItem.cons = matchingItem.cons;
        }
      });
    });
  }
}

export { D2BulkFetcher };
