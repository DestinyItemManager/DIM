'use strict';

angular.module("chromeStorage",[])
	.factory('chromeStorage', function($q) {
	var area = null;
	try {
		area = chrome.storage.local; // change this to chrome.storage.sync for sync capabilities
	} catch (err) {
		console.log("could not initiate chrome local storage: " + err);
	}

	/**
	 * These are provided and updated only for debugging purposes.
	 */
	var totalBytes = null;
	var cache = {};

	/**
	 * A call to get the bytes in use, returns a promise of the size of an individual key, or
	 * of total bytes in use, if no key is specified.
	 */
	var getBytesInUse = function (keys){
	    var deferred = $q.defer();

	    area.getBytesInUse(keys, function(bytesInUse) {
	        if (chrome.runtime.lasterror){
	        	console.log("error retrieving bytes in use for keys " + keys);
	            deferred.reject(chrome.runtime.lasterror.message);
	        }
	        else {
	        	console.log("retrieved bytes in use for keys " + keys + ": " + bytesInUse);
	            deferred.resolve(bytesInUse);
	        }
	    });

	    return deferred.promise;
	}

   return {
   	getDebuggingTotalBytesInUse: function() {
   		return totalBytes;
   	},
	getDebuggingCache: function() {
		return cache;
	},
	/**
	 * Returns the usage of the current storage quota, as a number between 0.0 and 1.0
	 */
	getDebuggingPercentUsed: function() {
		var percent = totalBytes / area.QUOTA_BYTES;
		return percent;
	},
	getDebuggingSizeOf: function(key) {
		return angular.toJson(cache[key]).length;
	},
	updateDebuggingCache: function() {
		var deferred = $q.defer();
		area.get(null, function (value) {
			if (chrome.runtime.lasterror){
	            deferred.reject(chrome.runtime.lasterror.message);
	        } else {
	          //console.log('get then for all keys : ' + angular.toJson(value));
  	          deferred.resolve(value);
  	        }
		});
		deferred.promise.then (function (data) {
			cache = data;
		});
	},
	updateDebuggingTotalBytes: function() {
		getBytesInUse(null).then(function(data) {
			console.log("total bytes in use: " + data);
			totalBytes = data;
		});
	},
    clearCache: function() {
		// console.log('clearing local cache');
		area.clear(function() {
			if (chrome.runtime.lastError) {
		        console.error("error clearing local cache" + chrome.runtime.lastError);
		    } else {
	    		console.log("cache has been cleared");
	    	}
		});
	},
	drop: function(key) {
		area.remove(key, function(){
			if (chrome.runtime.lasterror){
	            console.error(chrome.runtime.lasterror.message);
	        } else {
	        	// console.log("key " + key + " has been dropped from the storage cache")
	        }
		});
	},
	get: function(key) {
		var deferred = $q.defer();
		area.get(key, function (value) {
        	// console.log('getTotalBytesInUse then with key ' + key + " : " + angular.toJson(value));
        	var keyValue = value[key];
            deferred.resolve(keyValue);
		});
		return deferred.promise;
	},
	/**
	 * gets the value of key from the cache, or calls the fallback function, and populates the cache
	 * with the value of the promise returned
	 */
	getOrElse: function(key, fallback) {
		// console.log('getOrElse called with  cached key ' + key);
		var deferred = $q.defer();
        area.get(key, function(value) {
        	// console.log('getOrElse then with cached key ' + key + " : " + angular.toJson(value));
        	var keyValue = value[key];
        	if (keyValue == undefined || keyValue == null) {
        		// console.log("no cached value for "+ key + ". using fallback method.");
        		fallback().then(function(data) {
        			keyValue = data;
        			// console.log("caching value for "+ key + " : " + angular.toJson(keyValue));
        			var saveObject = {};
        			saveObject[key] = keyValue;
        			area.set(saveObject, function() {
        				if (chrome.runtime.lasterror){
				            console.error(chrome.runtime.lasterror.message);
				        } else {
		    				//console.log('saved ' + keyValue + " to key " + key);
		    			}
        			});
        			deferred.resolve(keyValue);
        		});
        	} else {
	        	deferred.resolve(keyValue);
	        }
        });
		return deferred.promise;
	},
	/**
	*
	*/
	set: function(key, value) {
		var saveObject = {};
		saveObject[key] = value;
		area.set(saveObject, function() {
			if (chrome.runtime.lasterror){
							console.error(chrome.runtime.lasterror.message);
					} else {
					// console.log('saved ' + keyValue + " to key " + key);
				}
		});
	},

	/**
	 * gets the value of key from the cache, or calls the fallback function, and populates the cache
	 * with the value of the promise returned
	 */
	forceGet: function(key, fallback) {
		// console.log('getOrElse called with  cached key ' + key);
		var deferred = $q.defer();
        fallback().then(function(data) {
			keyValue = data;
			// console.log("caching value for "+ key + " : " + angular.toJson(keyValue));
			var saveObject = {};
			saveObject[key] = keyValue;
			area.set(saveObject, function() {
				if (chrome.runtime.lasterror){
		            console.error(chrome.runtime.lasterror.message);
		        } else {
    				//console.log('saved ' + keyValue + " to key " + key);
    			}
			});
			deferred.resolve(keyValue);
		});
		return deferred.promise;
	},
	/**
	 * Returns the quota of the current storage method, in bytes
	 */
	getQuota: function() {
		return area.QUOTA_BYTES;
	}

   }
});
