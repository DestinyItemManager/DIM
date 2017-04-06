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

class gunListBuilder {
  constructor() {
    this._gunTransformer = new gunTransformer();
  }

  getNewItems(allItems) {
    return _.where(allItems, { isNew: true });
  }

  getAllItems(stores) {
    var allItems = [];

    stores.forEach(function(store) {
      allItems = allItems.concat(store.items);
    });

    return allItems;
  }

  getGuns(stores) {
    var allItems = this.getAllItems(stores);

    var allGuns = _.filter(allItems,
                        function(item) {
                          if (!item.primStat) {
                            return false;
                          }

                          return (item.primStat.statHash === 368428387);
                        });

    var newGuns = this.getNewItems(allGuns);

    if (newGuns.length > 0) {
      return newGuns;
    }

    return allGuns;
  }

  getWeaponList(stores) {
    var guns = this.getGuns(stores);

    var list = [];
    var self = this;

    guns.forEach(function(gun) {
      var dtrGun = self._gunTransformer.translateToDtrGun(gun);

      if (!self.isKnownGun(list, dtrGun)) {
        list.push(dtrGun);
      }
    });

    return list;
  }

  isKnownGun(list, dtrGun) {
    return _.contains(list, dtrGun);
  }
}

class trackerErrorHandler {
  handleErrors(response) {
    if (response.status !== 200) {
      return this.$q.reject(new Error("Destiny tracker service call failed."));
    }

    return response;
  }
}

class bulkFetcher {
  constructor($q, $http) {
    this.$q = $q;
    this.$http = $http;
    this._gunListBuilder = new gunListBuilder();
    this.trackerErrorHandler = new trackerErrorHandler();
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

    var weaponList = this._gunListBuilder.getWeaponList(stores.stores);

    var promise = this.$q
              .when(this.getBulkWeaponDataPromise(weaponList))
              .then(this.$http)
              .then(this.trackerErrorHandler.handleErrors, this.trackerErrorHandler.handleErrors)
              .then((response) => { return response.data; });

    return promise;
  }

  bulkFetch(stores) {
    this.getBulkFetchPromise(stores)
      .then((bulkRankings) => this.attachRankings(bulkRankings,
                                                  stores.stores));
  }

  attachRankings(bulkRankings,
                          stores) {
    if ((!bulkRankings) ||
        (!bulkRankings.length)) {
      return;
    }

    bulkRankings.forEach(function(bulkRanking) {
      stores.forEach(function(store) {
        store.items.forEach(function(storeItem) {
          if (storeItem.hash == bulkRanking.referenceId) {
            storeItem.dtrRating = bulkRanking.rating;
          }
        });
      });
    });
  }
}

class reviewsFetcher {
  constructor($q, $http) {
    this.$q = $q;
    this.$http = $http;
    this._gunTransformer = new gunTransformer();
    this.trackerErrorHandler = new trackerErrorHandler();
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
              .then(this.trackerErrorHandler.handleErrors, this.trackerErrorHandler.handleErrors)
              .then((response) => { return response.data; });

    return promise;
  }

  getUserReview(reviewData) {
    return _.findWhere(reviewData.reviews, { isReviewer: true });
  }

  attachReviews(item,
                reviewData) {
    var userReview = this.getUserReview(reviewData);

    if (userReview) {
      item.userRating = userReview.rating;
      item.userReview = userReview.review;
    }
  }

  getItemReviews(item) {
    this.getItemReviewsPromise(item)
      .then((data) => this.attachReviews(item,
                                         data));
  }
}

function DestinyTrackerService($q,
                               $http,
                               $rootScope,
                               dimPlatformService) {
  var _gunTransformer = new gunTransformer();
  var _bulkFetcher = new bulkFetcher($q, $http);
  var _reviewsFetcher = new reviewsFetcher($q, $http);

  $rootScope.$on('item-clicked', function(event, item) {
    _reviewsFetcher.getItemReviews(item);
  });

  $rootScope.$on('dim-stores-updated', function(event, stores) {
    _bulkFetcher.bulkFetch(stores);
  });

  $rootScope.$on('review-submitted', function(event, item, userReview) {
    _submitReview(item, userReview)
      .then((emptyResponse) => { return; });
  });

  function submitItemReviewPromise(itemReview) {
    return {
      method: 'POST',
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/reviews/submit',
      data: itemReview,
      dataType: 'json'
    };
  }

  function handleSubmitErrors(response) {
    if (response.status !== 204) {
      return $q.reject(new Error("Destiny tracker service submit failed."));
    }

    return response;
  }

  function toReviewer(membershipInfo) {
    return {
      membershipId: membershipInfo.membershipId,
      type: membershipInfo.type,
      displayName: membershipInfo.id
    };
  }

  function toRatingAndReview(userReview) {
    return {
      rating: userReview.rating,
      review: userReview.review
    };
  }

  function _submitReview(item, userReview) {
    var membershipInfo = dimPlatformService.getActive();

    var rollAndPerks = _gunTransformer.getRollAndPerks(item);
    var reviewer = toReviewer(membershipInfo);
    var review = toRatingAndReview(userReview);

    var rating = Object.assign(rollAndPerks, review);
    rating.reviewer = reviewer;

    var promise = $q
              .when(submitItemReviewPromise(rating))
              .then($http)
              .then(handleSubmitErrors, handleSubmitErrors)
              .then((response) => { return; });

    return promise;
  }

  return {
    authenticate: function() {
    },
    submitReview: function(membershipInfo, item, userReview) {
      var rollAndPerks = _gunTransformer.getRollAndPerks(item);
      var reviewer = toReviewer(membershipInfo);
      var review = toRatingAndReview(userReview);

      var rating = Object.assign(rollAndPerks, review);
      rating.reviewer = reviewer;

      var promise = $q
                .when(submitItemReviewPromise(rating))
                .then($http)
                .then(handleSubmitErrors, handleSubmitErrors)
                .then((response) => { return; });

      return promise;
    }
  };
}