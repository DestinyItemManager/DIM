angular-chrome-storage
============================

A utility resource for accessing [chrome.storage](https://developer.chrome.com/extensions/storage)

### Why use chrome.storage?

Chrome.storage is a great resource for chrome extensions- it can provide more storage than standard html5 localStorage, and can be accessed asynchronously, which can be useful. 

Also, accessing html5 localStorage in an extension will give you the error: ``window.localStorage is not available in packaged apps. Use chrome.storage.local instead.``.  

### Why use this wrapper library?

While chrome.storage is really useful, it is somewhat difficult to debug.

This resource makes it easy to retrieve data from storage, as well as to provide fallbacks to populate the data in the case of a cache miss.  It also provides simple functions to clear the data, and access statistics on the usage of the data and quota.
 
Instructions
------------

### [Optional] Install the chrome module using bower

Install using bower install

    bower install infomofo/angular-chrome-storage

Add the following script import

```html
    <script src="bower_components/angular-chrome-storage/angular-chrome-storage.js"></script>
```

### Import the chromeStorage module

```javascript
angular.module('myapp',['chromeStorage']);
```

### Usage

Information can be retrieved from chrome.storage by key using the ``get`` method

```javascript
    chromeStorage.get(key).then(function(keyValue) {
        //do something with the key value
    });
```

More commonly, the ``getOrElse`` method can be called, along with a fallback function if the key does not exist in the chrome.storage cache.  If the key does not exist, the fallback will be called and returned, and stored for that key for future calls.

```javascript
chromeStorage.getOrElse(key, function() {
        // a function to populate this key if it is not already in the cache
        return keyValue;
    }).then(function(keyValue) {
        // do something with the key value
    });
```

If you want to force the value to be returned from another function rather than defaulting to the value in chrome.storage, you can use ``forceGet``.

```javascript
chromeStorage.forceGet(key, function() {
        // a function to return and load in the cache for this key, regardless // of what is currently in the cache.
        return keyValue;
    }).then(function(keyValue) {
        // do something with the key value
    });
```

Information can be removed from the cache either by an individual key, or as a whole.

```javascript
chromeStorage.drop(key); // drops a key in chrome.storage asynchronously
chromeStorage.clearCache(); // clears all data in chrome.storage asynchronously
```

Various debugging functions are provided to provide data on the usage of your chrome cache.

```javascript
chromeStorage.getQuota(); // the max bytes that can be stored in chrome.storage

updateDebuggingCache(); // copies the cache into a local object for debugging
updateDebuggingTotalBytesUsed(); // saves the total bytes used to a local var

getDebuggingTotalBytesInUse(); // returns the saved total bytes used
getDebuggingCache(); // returns the saved local copy of the cache

getDebuggingPercentUsed(); // current quota usage, in a value between 0 and 1
getDebuggingSizeOf(key); // returns the estimated size of a key

```
