import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .factory('dimDestinyTrackerService', DestinyTrackerService);

class gunTransformer {
  translateToDtrGun(gun) {
    return {
      referenceId: gun.hash,
      roll: this.getDtrRoll(gun)
    };
  }

  getRollAndPerks(gun) {
    return {
      roll: this.getDtrRoll(gun),
      selectedPerks: this.getDtrPerks(gun),
      referenceId: gun.hash,
      instanceId: gun.id,
    };
  }

  getDtrPerks(gun) {
    if (!gun.talentGrid) {
      return null;
    }

    return gun.talentGrid.dtrPerks;
  }

  getDtrRoll(gun) {
    if (!gun.talentGrid) {
      return null;
    }

    return gun.talentGrid.dtrRoll;
  }
}

class ScoreMaintainer {
  constructor() {
    this._gunTransformer = new gunTransformer();
    this._itemStores = [];
  }

  getMatchingItem(dtrItem) {
    dtrItem.referenceId = String(dtrItem.referenceId);

    return _.findWhere(this._itemStores, { referenceId: dtrItem.referenceId, roll: dtrItem.roll });
  }

  getRatingData(item) {
    var dtrItem = this._gunTransformer.translateToDtrGun(item);

    var matchingItem = this.getMatchingItem(dtrItem);

    if (!matchingItem) {
      return null;
    }

    return matchingItem;
  }

  toAtMostOneDecimal(rating) {
    if (!rating) {
      return null;
    }

    if ((rating % 1) === 0) {
      return rating;
    }

    return rating.toFixed(1);
  }

  addScore(dtrRating) {
    dtrRating.rating = this.toAtMostOneDecimal(dtrRating.rating);

    this._itemStores.push(dtrRating);
  }

  addReviewData(item,
                userReview) {
    var dtrItem = this._gunTransformer.translateToDtrGun(item);
    var matchingItem = this.getMatchingItem(dtrItem);

    var rating = matchingItem.rating;

    Object.assign(matchingItem,
                  userReview);

    matchingItem.rating = rating;
  }

  getItemStores() {
    return this._itemStores;
  }
}

class gunListBuilder {
  constructor() {
    this._gunTransformer = new gunTransformer();
  }

  getNewItems(allItems, scoreMaintainer) {
    var self = this;
    var allDtrItems = _.map(allItems, function(item) { return self._gunTransformer.translateToDtrGun(item); });
    var allKnownDtrItems = scoreMaintainer.getItemStores();

    var unmatched = _.filter(allDtrItems, function(dtrItem) {
      var matchingItem = _.findWhere(allKnownDtrItems, { referenceId: String(dtrItem.referenceId), roll: dtrItem.roll });
      return (matchingItem === null);
    });

    return unmatched;
  }

  getAllItems(stores) {
    var allItems = [];

    stores.forEach(function(store) {
      allItems = allItems.concat(store.items);
    });

    return allItems;
  }

  getGuns(stores, scoreMaintainer) {
    var self = this;
    var allItems = this.getAllItems(stores);

    var allGuns = _.filter(allItems,
                        function(item) {
                          if (!item.primStat) {
                            return false;
                          }

                          return (item.primStat.statHash === 368428387);
                        });

    var newGuns = this.getNewItems(allGuns, scoreMaintainer);

    if (scoreMaintainer.getItemStores().length > 0) {
      return newGuns;
    }

    return _.map(allGuns, function(item) { return self._gunTransformer.translateToDtrGun(item); });
  }

  getWeaponList(stores, scoreMaintainer) {
    var guns = this.getGuns(stores, scoreMaintainer);

    var list = [];
    var self = this;

    guns.forEach(function(gun) {
      if (!self.isKnownGun(list, gun)) {
        list.push(gun);
      }
    });

    return list;
  }

  isKnownGun(list, dtrGun) {
    return _.contains(list, dtrGun);
  }
}

class trackerErrorHandler {
  constructor($q,
              $translate) {
    this.$q = $q;
    this.$translate = $translate;
  }

  handleErrors(response) {
    if (response.status !== 200) {
      return this.$q.reject(new Error(this.$translate.instant('DtrReview.ServiceCallError')));
    }

    return response;
  }

  handleSubmitErrors(response) {
    if (response.status !== 204) {
      return this.$q.reject(new Error(this.$translate.instant('DtrReview.ServiceSubmitError')));
    }

    return response;
  }
}

class bulkFetcher {
  constructor($q, $http, trackerErrorHandler, loadingTracker, scoreMaintainer) {
    this.$q = $q;
    this.$http = $http;
    this._gunListBuilder = new gunListBuilder();
    this._trackerErrorHandler = trackerErrorHandler;
    this._loadingTracker = loadingTracker;
    this._scoreMaintainer = scoreMaintainer;
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

    var weaponList = this._gunListBuilder.getWeaponList(stores.stores, this._scoreMaintainer);

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
        self._scoreMaintainer.addScore(bulkRanking);
      });
    }

    stores.forEach(function(store) {
      store.items.forEach(function(storeItem) {
        var matchingItem = self._scoreMaintainer.getRatingData(storeItem);

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

class reviewsFetcher {
  constructor($q, $http, trackerErrorHandler, loadingTracker) {
    this.$q = $q;
    this.$http = $http;
    this._gunTransformer = new gunTransformer();
    this._trackerErrorHandler = trackerErrorHandler;
    this._loadingTracker = loadingTracker;
  }

  getItemReviewsCall(item) {
    return {
      method: 'POST',
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/reviews',
      data: item,
      dataType: 'json'
    };
  }

  getItemReviewsPromise(item) {
    var postWeapon = this._gunTransformer.getRollAndPerks(item);

    var promise = this.$q
              .when(this.getItemReviewsCall(postWeapon))
              .then(this.$http)
              .then(this._trackerErrorHandler.handleErrors, this._trackerErrorHandler.handleErrors)
              .then((response) => { return response.data; });

    this._loadingTracker.addPromise(promise);

    return promise;
  }

  getUserReview(reviewData) {
    return _.findWhere(reviewData.reviews, { isReviewer: true });
  }

  attachReviews(item,
                reviewData) {
    var userReview = this.getUserReview(reviewData);

    item.communityReviews = reviewData.reviews;

    if (userReview) {
      item.userRating = userReview.rating;
      item.userReview = userReview.review;
      item.userReviewPros = userReview.pros;
      item.userReviewCons = userReview.cons;
    }
  }

  getItemReviews(item) {
    this.getItemReviewsPromise(item)
      .then((data) => this.attachReviews(item,
                                         data));
  }
}

class reviewSubmitter {
  constructor($q, $http, dimPlatformService, trackerErrorHandler, loadingTracker) {
    this.$q = $q;
    this.$http = $http;
    this._gunTransformer = new gunTransformer();
    this._trackerErrorHandler = trackerErrorHandler;
    this._dimPlatformService = dimPlatformService;
    this._loadingTracker = loadingTracker;
  }

  getReviewer() {
    var membershipInfo = this._dimPlatformService.getActive();

    return {
      membershipId: membershipInfo.membershipId,
      type: membershipInfo.type,
      displayName: membershipInfo.id
    };
  }

  toRatingAndReview(userReview) {
    return {
      rating: userReview.rating,
      review: userReview.review,
      pros: userReview.pros,
      cons: userReview.cons
    };
  }

  submitItemReviewCall(itemReview) {
    return {
      method: 'POST',
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/reviews/submit',
      data: itemReview,
      dataType: 'json'
    };
  }

  submitReviewPromise(item, userReview) {
    var rollAndPerks = this._gunTransformer.getRollAndPerks(item);
    var reviewer = this.getReviewer();
    var review = this.toRatingAndReview(userReview);

    var rating = Object.assign(rollAndPerks, review);
    rating.reviewer = reviewer;

    var promise = this.$q
              .when(this.submitItemReviewCall(rating))
              .then(this.$http)
              .then(this._trackerErrorHandler.handleSubmitErrors, this._trackerErrorHandler.handleSubmitErrors);

    this._loadingTracker.addPromise(promise);

    return promise;
  }

  submitReview(item, userReview) {
    this.submitReviewPromise(item, userReview);
  }
}

function DestinyTrackerService($q,
                               $http,
                               $rootScope,
                               dimPlatformService,
                               dimSettingsService,
                               $translate,
                               dimFeatureFlags,
                               loadingTracker) {
  var _scoreMaintainer = new ScoreMaintainer();
  var _trackerErrorHandler = new trackerErrorHandler($q, $translate);
  var _bulkFetcher = new bulkFetcher($q, $http, _trackerErrorHandler, loadingTracker, _scoreMaintainer);
  var _reviewsFetcher = new reviewsFetcher($q, $http, _trackerErrorHandler, loadingTracker);
  var _reviewSubmitter = new reviewSubmitter($q, $http, dimPlatformService, _trackerErrorHandler, loadingTracker);
  var _postEnabled = dimFeatureFlags.sendingWeaponDataEnabled;

  function _userHasNotOkayedPostingIds() {
    return (!dimSettingsService.allowIdPostToDtr);
  }

  $rootScope.$on('item-clicked', function(event, item) {
    if ((!_postEnabled) ||
        (_userHasNotOkayedPostingIds())) {
      return;
    }

    // TODO: pull from score maintainer if review exists instead
    _reviewsFetcher.getItemReviews(item);
  });

  $rootScope.$on('dim-stores-updated', function(event, stores) {
    if (!_postEnabled) {
      return;
    }

    _bulkFetcher.bulkFetch(stores);
  });

  $rootScope.$on('review-submitted', function(event, item, userReview) {
    if ((!_postEnabled) ||
        (_userHasNotOkayedPostingIds())) {
      return;
    }

    // TODO: bake item cache flush into submit promise
    _reviewSubmitter.submitReview(item, userReview);
  });

  return {
    init: function() {},
    reattachScores: function(stores) {
      _bulkFetcher.attachRankings(null,
                                  stores);
    },
    updateUserRankings: function(item,
                                 userReview) {
      _scoreMaintainer.addReviewData(item,
                                     userReview);
    }
  };
}