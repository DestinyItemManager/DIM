// This is a private copy of idb-keyval since https://github.com/jakearchibald/idb-keyval/pull/65 and https://github.com/jakearchibald/idb-keyval/pull/50 won't be merged

export class Store {
  private readonly _dbName: string;
  private readonly _storeName: string;
  private _dbp: Promise<IDBDatabase> | undefined;

  constructor(
    dbName = 'keyval-store',
    readonly storeName = 'keyval',
  ) {
    this._dbName = dbName;
    this._storeName = storeName;
  }

  _init(): void {
    if (this._dbp) {
      return;
    }
    this._dbp = new Promise<IDBDatabase>((resolve, reject) => {
      const openreq = indexedDB.open(this._dbName, 1);
      openreq.onerror = () => reject(openreq.error ?? new Error('IDB open error'));
      openreq.onsuccess = () => resolve(openreq.result);

      // First time setup: create an empty object store
      openreq.onupgradeneeded = () => {
        openreq.result.createObjectStore(this._storeName);
      };
    }).then((dbp) => {
      // On close, reconnect
      dbp.onclose = () => {
        this._dbp = undefined;
      };
      return dbp;
    });
  }

  _withIDBStore(
    type: IDBTransactionMode,
    callback: (store: IDBObjectStore) => void,
  ): Promise<void> {
    this._init();
    return this._dbp!.then(
      (db) =>
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(this.storeName, type);
          transaction.oncomplete = () => resolve();
          // Safari sometimes just rejects with null
          transaction.onerror = (e) =>
            reject((e.target as IDBTransaction).error ?? new Error('IDB unknown error'));
          transaction.onabort = () => reject(transaction.error ?? new Error('IDB aborted'));
          callback(transaction.objectStore(this.storeName));
        }),
    );
  }

  _close(): Promise<void> {
    this._init();
    return this._dbp!.then((db) => {
      db.close();
      this._dbp = undefined;
    });
  }

  _delete(): Promise<void> {
    this._close();
    return new Promise((resolve, reject) => {
      const deletereq = indexedDB.deleteDatabase(this._dbName);
      deletereq.onerror = () => reject(deletereq.error ?? new Error('IDB delete error'));
      deletereq.onsuccess = () => resolve();
    });
  }
}

let store: Store;

function getDefaultStore() {
  if (!store) {
    store = new Store();
  }
  return store;
}

export function get<Type>(key: IDBValidKey, store = getDefaultStore()): Promise<Type> {
  let req: IDBRequest<Type>;
  return store
    ._withIDBStore('readonly', (store) => {
      req = store.get(key) as IDBRequest<Type>;
    })
    .then(() => req.result);
}

export function set(key: IDBValidKey, value: unknown, store = getDefaultStore()): Promise<void> {
  return store._withIDBStore('readwrite', (store) => {
    store.put(value, key);
  });
}

export function del(key: IDBValidKey, store = getDefaultStore()): Promise<void> {
  return store._withIDBStore('readwrite', (store) => {
    store.delete(key);
  });
}

export function clear(store = getDefaultStore()): Promise<void> {
  return store._withIDBStore('readwrite', (store) => {
    store.clear();
  });
}

export function keys(store = getDefaultStore()): Promise<IDBValidKey[]> {
  const keys: IDBValidKey[] = [];

  return store
    ._withIDBStore('readonly', (store) => {
      // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
      // And openKeyCursor isn't supported by Safari.
      (store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
        if (!this.result) {
          return;
        }
        keys.push(this.result.key);
        this.result.continue();
      };
    })
    .then(() => keys);
}

export function close(store = getDefaultStore()): Promise<void> {
  return store._close();
}

export function deleteDatabase(store = getDefaultStore()): Promise<void> {
  return store._delete();
}

// When the app gets frozen (iOS PWA), close the IDBDatabase connection
window.addEventListener('freeze', () => {
  close();
});
