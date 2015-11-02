(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('dimItemBucketDefinitions', ItemBucketDefinitions);

  ItemBucketDefinitions.$inject = ['$q', '$timeout', '$http'];

  function ItemBucketDefinitions($q, $timeout, $http) {
    var deferred = $q.defer();

    $http.get('api-manifest/buckets.json?v=3.1.18.1')
      .success(function(data) {
        deferred.resolve(data);
      })
      .error(function(data) {
        deferred.reject(new Error('The item buckets definition file was not parsed correctly.'));
      });
      // .then(function(defs) {
      //     deferred.resolve(_.chain(defs.data).toArray().sortBy(function(bucket) { return bucket.bucketOrder; }).value());
      // });

    return {
      'getDefinitions': function() { return deferred.promise; }
    };
  }
})(angular);
