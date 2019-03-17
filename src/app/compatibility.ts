import { t } from 'i18next';
import _ from 'lodash';
import { showNotification } from './notifications/notifications';

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

// Notify once every 5 minutes
const notifyStorageFull = _.throttle(() => {
  setTimeout(() => {
    showNotification({
      type: 'error',
      title: t('Help.NoStorage'),
      body: `<p>${t('Help.NoStorageMessage')}</p>`
    });
  });
}, 5 * 60 * 1000);

export function handleLocalStorageFullError(e: Error) {
  if (e instanceof DOMException && e.code === DOMException.QUOTA_EXCEEDED_ERR) {
    console.error('Out of quota', e.message);
  }
  throw e;
}
