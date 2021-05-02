import { download } from 'app/utils/util';

/**
 * Export the data backup as a file
 */
export function exportBackupData(data: { importedToDimApi?: boolean }) {
  // Don't save the `importedToDimApi` flag
  const { importedToDimApi, ...otherData } = data;
  download(JSON.stringify(otherData), 'dim-data.json', 'application/json');
}
