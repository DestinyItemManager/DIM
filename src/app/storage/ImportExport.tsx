import React from 'react';
import './storage.scss';
import { t } from 'app/i18next-t';
import { AppIcon, downloadIcon } from 'app/shell/icons';
import FileUpload from 'app/dim-ui/FileUpload';
import { DropzoneOptions } from 'react-dropzone';
import _ from 'lodash';
import { ExportResponse } from '@destinyitemmanager/dim-api-types';
import { DimData } from './sync.service';

declare global {
  interface Window {
    MSStream: any;
  }
}

const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const supportsExport = !iOS;

export default function ImportExport({
  onExportData,
  onImportData,
}: {
  onExportData(): void;
  onImportData(data: DimData | ExportResponse): Promise<any>;
}) {
  if (!supportsExport) {
    return null;
  }

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

          await onImportData(data);
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

  const exportData = (e) => {
    e.preventDefault();
    onExportData();
  };

  return (
    <div className="storage-adapter">
      <h3>{t('Storage.ImportExport')}</h3>
      <p>
        <button type="button" className="dim-button" onClick={exportData}>
          <AppIcon icon={downloadIcon} /> {t('Storage.Export')}
        </button>
      </p>
      <FileUpload onDrop={importData} accept=".json" title={t('Storage.Import')} />
    </div>
  );
}
