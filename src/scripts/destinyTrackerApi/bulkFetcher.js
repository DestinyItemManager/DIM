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
    if (!stores.length) {
      return this.$q.resolve();
    }

    const weaponList = this._itemListBuilder.getWeaponList(stores, this._reviewDataCache);

    if (!weaponList.length) {
      return this.$q.resolve();
    }

    const promise = this.$q
              .when(this._getBulkWeaponDataEndpointPost(weaponList))
              .then(this.$http)
              .then(this._trackerErrorHandler.handleErrors, this._trackerErrorHandler.handleErrors)
              .then((response) => response.data);

    this._loadingTracker.addPromise(promise);

    return promise;
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied stores.
   *
   * @param {any} storesContainer
   *
   * @memberof BulkFetcher
   */
  bulkFetch(storesContainer) {
    const stores = storesContainer.stores;

    this._getBulkFetchPromise(stores)
      .then((bulkRankings) => this.attachRankings(bulkRankings,
                                                  stores));
  }

  attachRankings(bulkRankings,
                 stores) {
    if (!bulkRankings && !stores) {
      return;
    }

    const self = this;

    if (bulkRankings) {
      bulkRankings.forEach((bulkRanking) => {
        self._reviewDataCache.addScore(bulkRanking);
      });
    }

    stores.forEach((store) => {
      store.items.forEach((storeItem) => {
        if (storeItem.reviewable) {
          const matchingItem = self._reviewDataCache.getRatingData(storeItem);

          if (matchingItem) {
            storeItem.dtrRating = matchingItem.rating;
            storeItem.userRating = matchingItem.userRating;
            storeItem.userReview = matchingItem.review;
            storeItem.pros = matchingItem.pros;
            storeItem.cons = matchingItem.cons;
          }
        }
      });
    });
  }
}

export { BulkFetcher };
