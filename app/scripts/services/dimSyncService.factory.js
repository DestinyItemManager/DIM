(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('SyncService', SyncService);

  SyncService.$inject = ['$q'];

  function SyncService($q) {
    var cached, // cached is the JSON in local storage,
        fileId, // reference to the file in drive
        membershipId, // logged in bungie user id
        drive = { // drive api data
          'client_id': '22022180893-raop2mu1d7gih97t5da9vj26quqva9dc.apps.googleusercontent.com',
          'scope': 'https://www.googleapis.com/auth/drive.appfolder',
          'immediate': false
        };

    // check if the user is authorized with google drive
    function authorize(id) {
      var deferred = $q.defer();

      membershipId = id;

      gapi.auth.authorize(drive, function(result) {
        // if no errors, we're good to sync!
        drive.immediate = result && !result.error;

        // resolve promise for errors
        if(!result || result.error) {
          deferred.reject(result);
          return;
        }

        // load the drive client.
        gapi.client.load('drive', 'v2', function() {

          // grab all of the list files
          console.log('getting files');
          gapi.client.drive.files.list().execute(function(list) {

            // look for the saved file.
            for(var i = list.items.length; i > 0; i--) {
              if(list.items[i].title === 'DIM-' + membershipId) {
                console.log('found DIM-'+membershipId);
                fileId = file.id;
                deferred.resolve();
                return;
              }
            }

            // couldn't find the file, lets create a new one.
            gapi.client.request({
              'path': '/drive/v2/files',
              'method': 'POST',
              'body': {
                'title': 'DIM-' + id,
                'mimeType': 'application/json',
                'parents': [{'id': 'appfolder'}]
              }
            }).execute(function(file) {
              console.log('created DIM-'+membershipId);
              fileId = file.id;
              deferred.resolve();
            });
          });
        });
      });

      return deferred.promise;
    }

    // save data {key: value}
    function set(value, replace) {

      // use replace to override the data (useful for removes)
      if(!replace) {
        // update our data
        for(var i in value) {
          cached[i] = value[i];
        }
      }

      // save to local storage
      localStorage.setItem('DIM-' + membershipId, JSON.stringify(cached));
      console.log('storage saved', cached);

      // save to chrome sync
      if(chrome.storage) {
        chrome.storage.sync.set(cached, function() {
          console.log('saved to chrome sync.');
          if (chrome.runtime.lastError) {
            console.log('error with chrome sync.')
          }
        });
      }

      // save to google drive
      if(drive.immediate) {
        console.log('we have synced... trying to update');
        gapi.client.request({
          'path': '/upload/drive/v2/files/' + fileId,
          'method': 'PUT',
          'params': {'uploadType': 'media', 'alt': 'json'},
          'body': cached
        }).execute(function(updated){
          console.log('updated', updated)
        });
      }
    }

    // get DIM saved data
    function get(force) {

      // if we already have it, and we're not forcing a sync
      if(cached && !force) {
        return $q.resolve(cached);
      }

      // get from google drive
      if(drive.immediate) {
        gapi.client.drive.files.get({
          'fileId': fileId
        }).execute(function(resp) {
          console.log('got from drive', resp);
        });
      }

      // grab from localStorage first
      cached = JSON.parse(localStorage.getItem('DIM-' + membershipId));
      console.log('got storage', cached);

      // get from chrome sync
      if(chrome.storage) {
        chrome.storage.sync.get(null, function(data) {
          cached = data;
          console.log('synced from chrome');
        });
      }



      return $q.resolve(cached);
    }

    function remove(key) {

      // just delete that key, maybe someday save to an undo array?
      delete cached[key];

      // sync to data storage
      set(cached, true);
      console.log('removed key:', key, cached);
    }

    return {
      'authorize': authorize,
      'get': get,
      'set': set,
      'remove': remove
    };
  }
})(angular);
