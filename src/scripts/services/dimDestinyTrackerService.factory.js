import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .factory('dimDestinyTrackerService', DestinyTrackerService);

function DestinyTrackerService($q,
                               $http) {
    //todo: save/restore JWT from session storage
    var _remoteJwt = {};
    var _dimStoreService = {};
    var _gunListBuilder = {};

    function getBulkWeaponData(weaponList) {
      return {
        method: 'POST',
        url: 'https://www.destinytracker.com/api/weaponChecker/fetch',
        data: weaponList,
        dataType: 'json'
      };
    }

    function handleErrors(response) {
        //DTR-specific handling goes here
    }

    return {
        init: function(dimStoreService) {
            _dimStoreService = dimStoreService;
            _gunListBuilder = _gunListBuilder(dimStoreService);
        },
        authenticate: function() {  
        },
        bulkFetch: function(stores) {
            var weaponList = _gunListBuilder.getWeaponList(stores);

            var promise = $q.resolve()
                .then(getBulkWeaponData(weaponList))
                .then($http)
                .then(handleErrors, handleErrors)
                .then((response) => response.data.Response.data);

            return promise;
        }
    }
}

function _gunListBuilder() {
    function getGuns(stores) {
        var items = [];

        stores.forEach(function(item) {
            if (!item.primStat) {
                return;
            }

            if (item.primStat.statHash === 368428387) {
                items.push(item);
            }
        });
        
        return items;
    }

    function getWeaponList(stores) {
        var guns = getGuns(stores);

        var newList = [];

        guns.forEach(function(gun) {
        if(isKnownGun(newList, gun)) {
            newList.forEach(function(listGun) {
            if(listGun.hash == gun.hash) {
                var newPerk = {
                talentPerk: gun.talentGrid.dtrPerks,
                id: gun.id
                };

                listGun.talentPerks.push(newPerk);
                return true;
            }
            });
        } else {
            var perk = {
            talentPerk: gun.talentGrid.dtrPerks,
            id: gun.id
            };

            var listGun = {
            hash: gun.hash,
            talentPerks: [ perk ] 
            };

            newList.push(listGun);
        }
        });

        downloadJson("weaponJson", newList);
    }

    function isKnownGun(list, gun) {
        var foundGun = false;

        list.forEach(function(listGun) {
        if(listGun.hash == gun.hash) {
            foundGun = true;
            return true;
        }
        });

        return foundGun;
    }
}