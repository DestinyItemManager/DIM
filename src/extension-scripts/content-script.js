let db;

function getDB() {
  if (!db) {
    db = new Promise((resolve, reject) => {
      const openreq = indexedDB.open('keyval-store', 1);

      openreq.onerror = function() {
        reject(openreq.error);
      };

      openreq.onupgradeneeded = function() {
        // First time setup: create an empty object store
        openreq.result.createObjectStore('keyval');
      };

      openreq.onsuccess = function() {
        resolve(openreq.result);
      };
    });
  }
  return db;
}

function withStore(type, callback) {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('keyval', type);
      transaction.oncomplete = function() {
        resolve();
      };
      transaction.onerror = function() {
        reject(transaction.error);
      };
      callback(transaction.objectStore('keyval'));
    });
  });
}

const idbKeyval = {
  get: function(key) {
    let req;
    return withStore('readonly', (store) => {
      req = store.get(key);
    }).then(() => {
      return req.result;
    });
  }
};


function getDimData() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(null, (data) => {
      if (chrome.runtime.lastError) {
        const message = chrome.runtime.lastError.message;
        reject(new Error(message));
      } else {
        resolve(data);
      }
    });
  })
    .then((value) => {
      if (!value) {
        return idbKeyval.get('DIM-data').then((value) => {
          if (!value || Object.keys(value).length === 0) {
            return JSON.parse(localStorage.getItem('DIM'));
          }
          return value;
        });
      }
      return value;
    })
    .then((value) => {
      window.postMessage({ type: 'DIM_DATA_RESPONSE', data: value }, "*");
    });
}

window.addEventListener("message", (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) {
    return;
  }

  switch (event.data.type) {
  case 'DIM_EXT_PING':
    window.postMessage({ type: 'DIM_EXT_PONG' }, "*");
    break;

  case 'DIM_GET_DATA':
    getDimData();
    break;
  }
}, false);

window.postMessage({ type: 'DIM_EXT_PONG' }, "*");
