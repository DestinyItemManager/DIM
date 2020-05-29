import { get } from 'idb-keyval';
import { StorageAdapter, DimData } from './sync.service';

/**
 * Local storage using IndexedDB. IndexedDB has large storage limits,
 * but may be deleted by the browser!
 */
export class IndexedDBStorage implements StorageAdapter {
  supported = true;
  enabled = true;
  name = 'IndexedDBStorage';

  get() {
    return Promise.resolve(get<DimData>('DIM-data'));
  }
}
