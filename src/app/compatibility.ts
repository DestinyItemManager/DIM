import { t } from 'i18next';
import { $rootScope } from 'ngimport';
import { toaster } from './ngimport-more';

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
    console.log('storage test', e);
    setTimeout(() => {
      $rootScope.$apply(() =>
        toaster.pop({
          type: 'error',
          title: t('Help.NoStorage'),
          body: `<p>${t('Help.NoStorageMessage')}</p>`
        })
      );
    });
  }
}
