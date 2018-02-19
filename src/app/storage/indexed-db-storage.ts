import * as idbKeyval from 'idb-keyval';
import * as _ from 'underscore';
import { StorageAdapter } from './sync.service';

/**
 * Local storage using IndexedDB. IndexedDB has large storage limits,
 * but may be deleted by the browser!
 */
export class IndexedDBStorage implements StorageAdapter {
  supported = true;
  enabled = true;
  name = 'IndexedDBStorage';

  get() {
    return Promise.resolve(idbKeyval.get('DIM-data'));
  }

  set(value: object) {
    return Promise.resolve(idbKeyval.set('DIM-data', value));
  }
}
