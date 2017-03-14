import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .factory('dimDestinyTrackerService', DestinyTrackerService);

function DestinyTrackerService($q,
                               $http) {
    //todo: save/restore JWT from session storage
    var _remoteJwt = {};
    var _gunListBuilder = {};

    function getBulkWeaponDataPromise(gunList) {
      return {
        method: 'POST',
        url: 'https://reviews-api.destinytracker.net/api/weaponChecker/fetch',
        data: gunList,
        dataType: 'json'
      };
    }

    function submitItemReviewPromise(itemReview) {
        return {
            method: 'POST',
            url: 'https://reviews-api.destinytracker.net/api/weaponChecker/reviews/submit',
            data: itemReview,
            dataType: 'json'
        };
    }

    function handleErrors(response) {
        if(response.status != 200) {
            return $q.reject(new Error("Destiny tracker service call failed."));
        }

        return response;
    }

    function handleSubmitErrors(response) {
        if(response.status != 204) {
            return $q.reject(new Error("Destiny tracker service submit failed."));
        }

        return response;
    }

    function getReviewerInfo(membershipInfo) {
        return {
            membershipId: membershipInfo.membershipId,
            membershipType: membershipInfo.membershipType,
            displayName: membershipInfo.displayName
        };
    }

    return {
        init: function() {
            _gunListBuilder = gunListBuilder();
        },
        authenticate: function() {  
        },
        bulkFetch: function(stores) {
            var weaponList = _gunListBuilder.getWeaponList(stores);

            var promise = $q
                .when(getBulkWeaponDataPromise(weaponList))
                .then($http)
                .then(handleErrors, handleErrors)
                .then((response) => { return response.data; });

            return promise;
        },
        submitReview: function(membershipInfo, item, userReview) {
            var rollAndPerks = _gunListBuilder.getRollAndPerks(item);
            var reviewer = getReviewerInfo(membershipInfo);

            var rating = {
                referenceId: item.hash,
                roll: rollAndPerks.roll,
                selectedPerks: rollAndPerks.selectedPerks,
                instanceId: item.id,
                reviewer: {
                    membershipId: membershipInfo.membershipId,
                    type: membershipInfo.membershipType,
                    displayName: membershipInfo.id
                },
                rating: userReview.rating,
                review: userReview.review
            };

            var promise = $q
                .when(submitItemReviewPromise(rating))
                .then($http)
                .then(handleSubmitErrors, handleSubmitErrors)
                .then((response) => { return; });

            return promise;
        }
    }
}

function gunListBuilder() {
    var glb = {};

    function getAllItems(stores) {
        var allItems = [];

        stores.forEach(function(store) {
            allItems = allItems.concat(store.items);
        });

        return allItems;
    }

    function getGuns(stores) {
        var allItems = getAllItems(stores);

        return _.filter(allItems,
                        function(item) {
                            if(!item.primStat) {
                                return false;
                            }

                            return (item.primStat.statHash === 368428387);
                        });
    }

    glb.getWeaponList = function(stores) {
        var guns = getGuns(stores);

        var list = [];

        guns.forEach(function(gun) {
            var dtrGun = translateToDtrGun(gun);

            if(!_.contains(list, dtrGun)) {
                list.push(dtrGun);
            }
        });

        return list;        
    }

    function getDtrPerks(gun) {
        if(!gun.talentGrid) {
            return null;
        }

        return gun.talentGrid.dtrPerks;
    }

    function getGunRoll(gun) {
        var dtrPerks = getDtrPerks(gun);

        if(dtrPerks.length > 0) {
            return dtrPerks.replace(/o/g, "");
        }

        return null;
    }

    function translateToDtrGun(gun) {
        return { 
            referenceId: gun.hash,
            roll: getGunRoll(gun)
        };
    }

    glb.getRollAndPerks = function(gun) {
        return {
            roll: getGunRoll(gun),
            selectedPerks: getDtrPerks(gun)
        };
    }

    function isKnownGun(list, dtrGun) {
        return _.contains(list, dtrGun);
    }

    return glb;
}