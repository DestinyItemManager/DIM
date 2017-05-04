import { gunListBuilder } from './gunListBuilder.js';

class bulkFetcher {
  constructor($q, $http, trackerErrorHandler, loadingTracker, scoreMaintainer) {
    this.$q = $q;
    this.$http = $http;
    this._gunListBuilder = new gunListBuilder();
    this._trackerErrorHandler = trackerErrorHandler;
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = scoreMaintainer;
  }

  getBulkWeaponDataPromise(gunList) {
    return {
      method: 'POST',
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/fetch',
      data: gunList,
      dataType: 'json'
    };
  }

  getBulkFetchPromise(stores) {
    if (stores.stores.length === 0) {
      return this.$q.resolve();
    }

    var weaponList = this._gunListBuilder.getWeaponList(stores.stores, this._reviewDataCache);

    if (!weaponList.length) {
      return this.$q.resolve();
    }

    var promise = this.$q
              .when(this.getBulkWeaponDataPromise(weaponList))
              .then(this.$http)
              .then(this._trackerErrorHandler.handleErrors, this._trackerErrorHandler.handleErrors)
              .then((response) => { return response.data; });

    this._loadingTracker.addPromise(promise);

    return promise;
  }

  bulkFetch(stores) {
    this.getBulkFetchPromise(stores)
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
          storeItem.userRating = matchingItem.rating;
          storeItem.userReview = matchingItem.review;
          storeItem.pros = matchingItem.pros;
          storeItem.cons = matchingItem.cons;
        }
      });
    });
  }
}

export { bulkFetcher };