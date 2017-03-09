import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .factory('dimDestinyTrackerService', DestinyTrackerService);

function DestinyTrackerService($q,
                               $http) {
    //todo: save/restore JWT from session storage
    var _remoteJwt = {};
    var _gunListBuilder = {};

    function getBulkWeaponData(gunList) {
      return {
        method: 'POST',
        url: 'https://www.destinytracker.com/api/weaponChecker/fetch',
        data: { weaponList: gunList },
        dataType: 'json'
      };
    }

    function handleErrors(response) {
        //DTR-specific handling goes here
    }

    return {
        init: function() {
            _gunListBuilder = gunListBuilder();
        },
        authenticate: function() {  
        },
        bulkFetch: function(membershipType, membershipId, stores) {
            var weaponList = _gunListBuilder.getWeaponList(stores);

            var bulkCollection = { 
                membershipType: membershipType,
                membershipId: membershipId,
                weaponCollection: weaponList
            };

            var promise = $q
                .when(getBulkWeaponData(weaponList))
                .then($http)
                .then(handleErrors, handleErrors)
                .then((response) => response.data.Response.data);

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

        var newList = [];

        guns.forEach(function(gun) {
            if(isKnownGun(newList, gun)) {
                newList.forEach(function(listGun) {
                    if(listGun.hash == gun.hash) {
                        var newPerk = {
                            roll: getGunRoll(gun),
                            instanceIds: [ gun.id ]
                        };

                        listGun.talentPerks.push(newPerk);
                        return true;
                    }
                });
            } else {
                var perk = {
                    roll: getGunRoll(gun),
                    instanceIds: [ gun.id ]
                };

                var listGun = {
                    hash: gun.hash,
                    talentPerks: [ perk ] 
                };

                newList.push(listGun);
            }
        });

        return newList;        
    }

    function getGunRoll(gun) {
        if(!gun.talentGrid) {
            return null;
        }

        return gun.talentGrid.dtrPerks.replace(/o/g, "");
    }

    function isKnownGun(list, gun) {
        var foundGun = false;

        var gunRoll = getGunRoll(gun);

        list.forEach(function(listGun) {
            var listGunRoll = getGunRoll(listGun);

            if(listGunRoll == gunRoll) {
                foundGun = true;
                return true;
            }
        });

        return foundGun;
    }

    return glb;
}