import * as _ from 'underscore';
import { D2ItemListBuilder } from './d2-itemListBuilder';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { DtrBulkItem } from '../item-review/destiny-tracker.service';
import { D2ReviewDataCache } from './d2-reviewDataCache';
import { IPromise } from 'angular';
import { $q, $http } from 'ngimport';
import { D2TrackerErrorHandler } from './d2-trackerErrorHandler';

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

  _getBulkWeaponDataEndpointPost(gunList, platformSelection) {
    return {
      method: 'POST',
      url: `https://db-api.destinytracker.com/api/external/reviews/fetch?platform=${platformSelection}`,
      data: gunList,
      dataType: 'json'
    };
  }

  _getBulkFetchPromise(stores: DimStore[], platformSelection: number): IPromise<DtrBulkItem[]> {
    if (!stores.length) {
      const emptyVotes: DtrBulkItem[] = [];
      return $q.resolve(emptyVotes);
    }

    const weaponList = this._itemListBuilder.getWeaponList(stores, this._reviewDataCache);

    if (!weaponList.length) {
      const emptyVotes: DtrBulkItem[] = [];
      return $q.resolve(emptyVotes);
    }

    const promise = $q
      .when(this._getBulkWeaponDataEndpointPost(weaponList, platformSelection))
      .then($http)
      .then(this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler), this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler))
      .then((response) => response.data);

    this._loadingTracker.addPromise(promise);

    return promise as IPromise<DtrBulkItem[]>;
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied stores.
   */
  bulkFetch(stores: DimStore[], platformSelection: number) {
    this._getBulkFetchPromise(stores, platformSelection)
      .then((bulkRankings) => this.attachRankings(bulkRankings,
                                                  stores));
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied vendors.
   */
  bulkFetchVendorItems(vendorContainer, platformSelection: number) {
    const vendors = _.values(vendorContainer);

    this._getBulkFetchPromise(vendors, platformSelection)
      .then((bulkRankings) => this.attachVendorRankings(bulkRankings,
                                                        vendors));
  }

  attachRankings(bulkRankings: DtrBulkItem[] | null,
                 stores: DimStore[]): void {
    if (!bulkRankings && !stores) {
      return;
    }

    this._reviewDataCache.addScores(bulkRankings);

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
