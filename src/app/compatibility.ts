import { showInfoPopup } from './shell/info-popup';
import { t } from 'i18next';
import { $rootScope } from 'ngimport';

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
        showInfoPopup(
          'no-storage',
          {
            title: t('Help.NoStorage'),
            body: t('Help.NoStorageMessage'),
            type: 'error',
            hideable: false
          },
          0
        )
      );
    });
  }
}
