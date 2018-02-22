import * as _ from 'underscore';
import { D2ItemListBuilder } from './d2-itemListBuilder';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { DtrItemWithVotes } from './d2-dtr-class-defs';
import { D2ReviewDataCache } from './d2-reviewDataCache';
import { IPromise } from 'angular';

class D2BulkFetcher {
  _reviewDataCache: D2ReviewDataCache;
  _loadingTracker: any;
  _trackerErrorHandler: any;
  _itemListBuilder: D2ItemListBuilder;
  $http: any;
  $q: any;
  constructor($q, $http, trackerErrorHandler, loadingTracker, reviewDataCache) {
    this.$q = $q;
    this.$http = $http;
    this._itemListBuilder = new D2ItemListBuilder();
    this._trackerErrorHandler = trackerErrorHandler;
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

  _getBulkFetchPromise(stores: DimStore[], platformSelection: number): IPromise<DtrItemWithVotes[]> {
    if (!stores.length) {
      return this.$q.resolve();
    }

    const weaponList = this._itemListBuilder.getWeaponList(stores, this._reviewDataCache);

    if (!weaponList.length) {
      return this.$q.resolve();
    }

    const promise = this.$q
      .when(this._getBulkWeaponDataEndpointPost(weaponList, platformSelection))
      .then(this.$http)
      .then(this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler), this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler))
      .then((response) => response.data);

    this._loadingTracker.addPromise(promise);

    return promise;
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

  attachRankings(bulkRankings: DtrItemWithVotes[] | null,
                 stores: DimStore[]) {
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
            storeItem.userVote = matchingItem.voted;
            storeItem.userReview = matchingItem.text;
            storeItem.pros = matchingItem.pros;
            storeItem.cons = matchingItem.cons;
          }
        }
      });
    });
  }

  attachVendorRankings(bulkRankings,
                       vendors) {
    if (!bulkRankings && !vendors) {
      return;
    }

    if (bulkRankings) {
      bulkRankings.forEach((bulkRanking) => {
        this._reviewDataCache.addScore(bulkRanking);
      });
    }

    vendors.forEach((vendor) => {
      vendor.allItems.forEach((vendorItemContainer) => {
        const vendorItem = vendorItemContainer.item;

        const matchingItem = this._reviewDataCache.getRatingData(vendorItem);

        if (matchingItem) {
          vendorItem.dtrRating = matchingItem.rating;
          vendorItem.dtrRatingCount = matchingItem.ratingCount;
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
