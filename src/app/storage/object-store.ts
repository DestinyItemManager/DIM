/*
 * The object store is an abstraction over either the FileSystem API with Origin
 * Private FileSystem (OPFS) or IndexedDB (IDB). It provides a high level
 * interface for storing and retrieving a JSON object between sessions.
 */

import { getCurrentHub, startTransaction } from '@sentry/browser';
import { reportException } from 'app/utils/exceptions';
import { errorLog, timer } from 'app/utils/log';
import idbReady from 'safari-14-idb-fix';
import { del, deleteDatabase, get, set } from './idb-keyval';

const supportsOPFS =
  $featureFlags.opfs &&
  'storage' in navigator &&
  'getDirectory' in navigator.storage &&
  // Safari doesn't support the async methods and only really supports OPFS from a Worker context
  'createWritable' in FileSystemFileHandle.prototype;

let root: FileSystemDirectoryHandle | undefined;

function measure(tag: string) {
  const label = `${supportsOPFS ? 'opfs' : 'idb'}:${tag}`;
  const stopTimer = timer(label);
  const transaction = $featureFlags.sentry ? startTransaction({ name: label }) : undefined;
  // set the transaction on the scope so it picks up any errors
  getCurrentHub()?.configureScope((scope) => scope.setSpan(transaction));
  return () => {
    transaction?.finish();
    stopTimer();
  };
}

export async function loadObject<T>(key: string): Promise<T | undefined> {
  const end = measure(`loadObject:${key}`);
  try {
    if (supportsOPFS) {
      try {
        const fileHandle = await root!.getFileHandle(`${key}.json`, { create: false });
        const file = await fileHandle.getFile();
        if (file.size === 0) {
          return undefined;
        }

        // Rather than JSON.stringify(await file.text()) we can theoretically off-main-thread stream it through Response?
        const resp = new Response(file);
        return ((await resp.json()) as T) ?? undefined;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'NotFoundError') {
          return undefined;
        }

        throw e;
      }
    } else {
      return await (get<T>(key) ?? undefined);
    }
  } finally {
    end();
  }
}

export async function storeObject<T>(key: string, obj: T): Promise<void> {
  const end = measure(`storeObject:${key}`);
  try {
    if (supportsOPFS) {
      const fileHandle = await root!.getFileHandle(`${key}.json`, { create: true });
      const file = await fileHandle.createWritable();
      await file.write(JSON.stringify(obj));
      await file.close();
    } else {
      return await set(key, obj);
    }
  } finally {
    end();
  }
}

export async function deleteObject(key: string): Promise<void> {
  const end = measure(`deleteObject:${key}`);
  try {
    if (supportsOPFS) {
      try {
        await root!.removeEntry(`${key}.json`);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'NotFoundError') {
          return undefined;
        }

        throw e;
      }
    } else {
      return await del(key);
    }
  } finally {
    end();
  }
}

export async function initObjectStore(): Promise<void> {
  if (supportsOPFS) {
    root = await navigator.storage.getDirectory();
  } else {
    // idbReady works around a bug in Safari 14 where IndexedDB doesn't initialize sometimes. Fixed in Safari 14.7
    await idbReady();
  }
}

export async function testObjectStore(): Promise<boolean> {
  if (supportsOPFS) {
    return true;
  } else {
    if (!window.indexedDB) {
      errorLog('storage', 'IndexedDB not available');
      return false;
    }

    try {
      await set('idb-test', true);
    } catch (e) {
      errorLog('storage', 'Failed IndexedDB Set Test - trying to delete database', e);
      try {
        await deleteDatabase();
        await set('idb-test', true);
        // Report to sentry, I want to know if this ever works
        reportException('deleting database fixed IDB set', e);
      } catch (e2) {
        errorLog('storage', 'Failed IndexedDB Set Test - deleting database did not help', e2);
      }
      reportException('Failed IndexedDB Set Test', e);
      return false;
    }

    try {
      const idbValue = await get<boolean>('idb-test');
      return idbValue;
    } catch (e) {
      errorLog('storage', 'Failed IndexedDB Get Test - trying to delete database', e);
      try {
        await deleteDatabase();
        const idbValue = await get<boolean>('idb-test');
        if (idbValue) {
          // Report to sentry, I want to know if this ever works
          reportException('deleting database fixed IDB get', e);
        }
        return idbValue;
      } catch (e2) {
        errorLog('storage', 'Failed IndexedDB Get Test - deleting database did not help', e2);
      }
      reportException('Failed IndexedDB Get Test', e);
      return false;
    }
  }
}
