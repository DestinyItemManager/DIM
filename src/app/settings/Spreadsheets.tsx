import FileUpload from 'app/dim-ui/FileUpload';
import { t } from 'app/i18next-t';
import { storesLoadedSelector } from 'app/inventory/selectors';
import { downloadCsvFiles, importTagsNotesFromCsv } from 'app/inventory/spreadsheets';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React from 'react';
import { DropzoneOptions } from 'react-dropzone';
import { useSelector } from 'react-redux';
import { AppIcon, spreadsheetIcon } from '../shell/icons';

export default function Spreadsheets() {
  const dispatch = useThunkDispatch();
  const disabled = !useSelector(storesLoadedSelector);

  const importCsv: DropzoneOptions['onDrop'] = async (acceptedFiles) => {
    if (acceptedFiles.length < 1) {
      alert(t('Csv.ImportWrongFileType'));
      return;
    }

    if (!confirm(t('Csv.ImportConfirm'))) {
      return;
    }
    try {
      const result = await dispatch(importTagsNotesFromCsv(acceptedFiles));
      alert(t('Csv.ImportSuccess', { count: result }));
    } catch (e) {
      alert(t('Csv.ImportFailed', { error: e.message }));
    }
  };

  const downloadCsv = (type: 'Armor' | 'Weapons' | 'Ghost') => dispatch(downloadCsvFiles(type));

  return (
    <section id="spreadsheets">
      <h2>{t('Settings.Data')}</h2>
      <div className="setting horizontal">
        <label htmlFor="spreadsheetLinks" title={t('Settings.ExportSSHelp')}>
          {t('Settings.ExportSS')}
        </label>
        <div>
          <button
            type="button"
            className="dim-button"
            onClick={() => downloadCsv('Weapons')}
            disabled={disabled}
          >
            <AppIcon icon={spreadsheetIcon} /> <span>{t('Bucket.Weapons')}</span>
          </button>{' '}
          <button
            type="button"
            className="dim-button"
            onClick={() => downloadCsv('Armor')}
            disabled={disabled}
          >
            <AppIcon icon={spreadsheetIcon} /> <span>{t('Bucket.Armor')}</span>
          </button>{' '}
          <button
            type="button"
            className="dim-button"
            onClick={() => downloadCsv('Ghost')}
            disabled={disabled}
          >
            <AppIcon icon={spreadsheetIcon} /> <span>{t('Bucket.Ghost')}</span>
          </button>
        </div>
      </div>
      <div className="setting">
        <FileUpload
          title={t('Settings.CsvImport')}
          accept={{ 'text/csv': ['.csv'] }}
          onDrop={importCsv}
        />
      </div>
    </section>
  );
}
