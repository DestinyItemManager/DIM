import React from 'react';
import './storage.scss';
import { t } from 'app/i18next-t';
import { AppIcon, downloadIcon } from 'app/shell/icons';
import FileUpload from 'app/dim-ui/FileUpload';
import { SyncService } from './sync.service';
import { DropzoneOptions } from 'react-dropzone';
import { dataStats } from './data-stats';
import _ from 'lodash';
import { initSettings } from 'app/settings/settings';
import store from 'app/store/store';
import { importLegacyData } from 'app/dim-api/actions';

declare global {
  interface Window {
    MSStream: any;
  }
}

const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const supportsExport = !iOS;

// TODO: redux action
const exportData = (e) => {
  e.preventDefault();
  // Function to download data to a file
  function download(data, filename, type) {
    const a = document.createElement('a');
    const file = new Blob([data], { type });
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  // TODO: call "export" from the API, or just dump the profile info

  SyncService.get().then((data) => {
    download(JSON.stringify(data), 'dim-data.json', 'application/json');
  });
  return false;
};

// TODO: definitely a redux action
const importData: DropzoneOptions['onDrop'] = (acceptedFiles) => {
  if (acceptedFiles.length < 1) {
    alert(t('Storage.ImportWrongFileType'));
    return;
  }
  if (acceptedFiles.length > 1) {
    alert(t('Storage.ImportTooManyFiles'));
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    if (reader.result && typeof reader.result === 'string') {
      try {
        // dispatch action here?
        const data = JSON.parse(reader.result);

        // Replace this, support importing both!
        const stats = dataStats(data);

        const statsLine = _.map(
          stats,
          (value, key) => (value ? t(`Storage.${key}`, { value }) : undefined)
          // t('Storage.LoadoutsD1')
          // t('Storage.LoadoutsD2')
          // t('Storage.TagNotesD1')
          // t('Storage.TagNotesD2')
          // t('Storage.Settings')
          // t('Storage.IgnoredUsers')
        )
          .filter(Boolean)
          .join(', ');

        if (confirm(t('Storage.ImportConfirm', { stats: statsLine }))) {
          await SyncService.set(data, true);
          await Promise.all(SyncService.adapters.map(refreshAdapter));
          initSettings();
          if ($featureFlags.dimApi) {
            await ((store.dispatch(importLegacyData(data, true)) as any) as Promise<any>);
          }
          alert(t('Storage.ImportSuccess'));
        }
      } catch (e) {
        alert(t('Storage.ImportFailed', { error: e.message }));
      }
    }
  };

  const file = acceptedFiles[0];
  if (file) {
    reader.readAsText(file);
  } else {
    alert(t('Storage.ImportNoFile'));
  }
  return false;
};

export default function ImportExport() {
  if (!supportsExport) {
    return null;
  }

  return (
    <div className="storage-adapter">
      <h2>{t('Storage.ImportExport')}</h2>
      <p>
        <button className="dim-button" onClick={exportData}>
          <AppIcon icon={downloadIcon} /> {t('Storage.Export')}
        </button>
      </p>
      <FileUpload onDrop={importData} accept=".json" title={t('Storage.Import')} />
      <p />
    </div>
  );
}
