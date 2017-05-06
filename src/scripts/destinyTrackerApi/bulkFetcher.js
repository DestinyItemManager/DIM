import { ItemListBuilder } from './itemListBuilder';

class BulkFetcher {
  constructor($q, $http, trackerErrorHandler, loadingTracker, scoreMaintainer) {
    this.$q = $q;
    this.$http = $http;
    this._itemListBuilder = new ItemListBuilder();
    this._trackerErrorHandler = trackerErrorHandler;
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = scoreMaintainer;
  }

  _getBulkWeaponDataEndpointPost(gunList) {
    return {
      method: 'POST',
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/fetch',
      data: gunList,
      dataType: 'json'
    };
  }

  _getBulkFetchPromise(stores) {
    if (stores.stores.length === 0) {
      return this.$q.resolve();
    }

    var weaponList = this._itemListBuilder.getWeaponList(stores.stores, this._reviewDataCache);

    if (!weaponList.length) {
      return this.$q.resolve();
    }

    var promise = this.$q
              .when(this._getBulkWeaponDataEndpointPost(weaponList))
              .then(this.$http)
              .then(this._trackerErrorHandler.handleErrors, this._trackerErrorHandler.handleErrors)
              .then((response) => { return response.data; });

    this._loadingTracker.addPromise(promise);

    return promise;
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied stores.
   *
   * @param {any} stores
   *
   * @memberof BulkFetcher
   */
  bulkFetch(stores) {
    this._getBulkFetchPromise(stores)
      .then((bulkRankings) => this.attachRankings(bulkRankings,
                                                  stores.stores));
  }

  attachRankings(bulkRankings,
                 stores) {
    if ((!bulkRankings) &&
        (!stores)) {
      return;
    }

    var self = this;

    if (bulkRankings) {
      bulkRankings.forEach(function(bulkRanking) {
        self._reviewDataCache.addScore(bulkRanking);
      });
    }

    stores.forEach(function(store) {
      store.items.forEach(function(storeItem) {
        var matchingItem = self._reviewDataCache.getRatingData(storeItem);

        if (matchingItem) {
          storeItem.dtrRating = matchingItem.rating;
          storeItem.userRating = matchingItem.userRating;
          storeItem.userReview = matchingItem.review;
          storeItem.pros = matchingItem.pros;
          storeItem.cons = matchingItem.cons;
        }
      });
    });
  }
}

export { BulkFetcher };