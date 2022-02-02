import { t } from 'app/i18next-t';
import ErrorPanel from 'app/shell/ErrorPanel';
import { deleteDatabase, set } from 'app/storage/idb-keyval';
import { reportException } from 'app/utils/exceptions';
import { errorLog } from 'app/utils/log';

export function StorageBroken() {
  return (
    <div className="dim-page">
      <ErrorPanel
        title={t('Help.NoStorage')}
        fallbackMessage={t('Help.NoStorageMessage')}
        showTwitters={true}
      />
    </div>
  );
}

export async function storageTest() {
  try {
    localStorage.setItem('test', 'true');
  } catch (e) {
    errorLog('storage', 'Failed localStorage Test', e);
    return false;
  }

  if (!window.indexedDB) {
    errorLog('storage', 'IndexedDB not available');
    return false;
  }

  try {
    await set('idb-test', true);
  } catch (e) {
    errorLog('storage', 'Failed IndexedDB Test - trying to delete database', e);
    try {
      await deleteDatabase();
      await set('idb-test', true);
      // Report to sentry, I want to know if this ever works
      reportException('deleting database fixed IDB', e);
    } catch (e2) {
      errorLog('storage', 'Failed IndexedDB Test - deleting database did not help', e);
      return false;
    }
  }

  return true;
}
