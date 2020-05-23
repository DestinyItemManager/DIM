import { t } from 'app/i18next-t';
import _ from 'lodash';
import { showNotification } from './notifications/notifications';

// Notify at most once every 5 minutes
const notifyStorageFull = _.throttle(() => {
  setTimeout(() => {
    showNotification({
      type: 'error',
      title: t('Help.NoStorage'),
      body: t('Help.NoStorageMessage'),
    });
  });
}, 5 * 60 * 1000);

/**
 * Test and alert if crucial functionality is missing.
 */
export function testFeatureCompatibility() {
  try {
    localStorage.setItem('test', 'true');
    if (!window.indexedDB) {
      throw new Error('IndexedDB not available');
    }
  } catch (e) {
    notifyStorageFull();
    console.log('storage test', e);
  }
}

export function handleLocalStorageFullError(e: Error) {
  if (e instanceof DOMException && e.code === DOMException.QUOTA_EXCEEDED_ERR) {
    notifyStorageFull();
    console.error('Out of quota', e.message);
  }
  throw e;
}
