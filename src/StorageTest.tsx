import { t } from 'app/i18next-t';
import ErrorPanel from 'app/shell/ErrorPanel';
import { deleteDatabase, get, set } from 'app/storage/idb-keyval';
import { errorLog } from 'app/utils/log';
import { reportException } from 'app/utils/sentry';

const TAG = 'storage';

export function StorageBroken() {
  return (
    <div className="dim-page">
      <ErrorPanel
        title={t('Help.NoStorage')}
        fallbackMessage={t('Help.NoStorageMessage')}
        showSocials
      />
    </div>
  );
}

export async function storageTest() {
  try {
    localStorage.setItem('test', 'true');
  } catch (e) {
    errorLog(TAG, 'Failed localStorage Test', e);
    return false;
  }

  if (!window.indexedDB) {
    errorLog(TAG, 'IndexedDB not available');
    return false;
  }

  try {
    await set('idb-test', true);
  } catch (e) {
    errorLog(TAG, 'Failed IndexedDB Set Test - trying to delete database', e);
    try {
      await deleteDatabase();
      await set('idb-test', true);
      // Report to sentry, I want to know if this ever works
      reportException('deleting database fixed IDB set', e);
    } catch (e2) {
      errorLog(TAG, 'Failed IndexedDB Set Test - deleting database did not help', e2);
    }
    reportException('Failed IndexedDB Set Test', e);
    return false;
  }

  try {
    const idbValue = await get<boolean>('idb-test');
    return idbValue;
  } catch (e) {
    errorLog(TAG, 'Failed IndexedDB Get Test - trying to delete database', e);
    try {
      await deleteDatabase();
      const idbValue = await get<boolean>('idb-test');
      if (idbValue) {
        // Report to sentry, I want to know if this ever works
        reportException('deleting database fixed IDB get', e);
      }
      return idbValue;
    } catch (e2) {
      errorLog(TAG, 'Failed IndexedDB Get Test - deleting database did not help', e2);
    }
    reportException('Failed IndexedDB Get Test', e);
    return false;
  }
}
