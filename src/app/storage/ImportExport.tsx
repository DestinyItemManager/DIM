import { ExportResponse } from '@destinyitemmanager/dim-api-types';
import FileUpload from 'app/dim-ui/FileUpload';
import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { AppIcon, downloadIcon } from 'app/shell/icons';
import { errorMessage } from 'app/utils/errors';
import React from 'react';
import { DropzoneOptions } from 'react-dropzone';

export default function ImportExport({
  onExportData,
  onImportData,
}: {
  onExportData: () => void;
  onImportData: (data: ExportResponse) => Promise<void>;
}) {
  const importData: DropzoneOptions['onDrop'] = (acceptedFiles) => {
    if (acceptedFiles.length < 1) {
      showNotification({ type: 'error', title: t('Storage.ImportWrongFileType') });
      return;
    }
    if (acceptedFiles.length > 1) {
      showNotification({ type: 'error', title: t('Storage.ImportTooManyFiles') });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (reader.result && typeof reader.result === 'string') {
        try {
          // dispatch action here?
          const data = JSON.parse(reader.result) as ExportResponse;

          await onImportData(data);
        } catch (e) {
          showNotification({
            type: 'error',
            title: t('Storage.ImportFailed', { error: errorMessage(e) }),
          });
        }
      }
    };

    const file = acceptedFiles[0];
    if (file) {
      reader.readAsText(file);
    } else {
      showNotification({ type: 'error', title: t('Storage.ImportNoFile') });
    }
    return false;
  };

  const exportData = (e: React.MouseEvent) => {
    e.preventDefault();
    onExportData();
  };

  return (
    <>
      <span>{t('Storage.ImportExport')}</span>
      <button type="button" className="dim-button" onClick={exportData}>
        <AppIcon icon={downloadIcon} /> {t('Storage.Export')}
      </button>
      <FileUpload
        onDrop={importData}
        accept={{ 'application/json': ['.json'] }}
        title={t('Storage.Import')}
      />
    </>
  );
}
