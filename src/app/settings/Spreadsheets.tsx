import React from 'react';
import { t } from 'app/i18next-t';
import FileUpload from 'app/dim-ui/FileUpload';
import { AppIcon, spreadsheetIcon } from '../shell/icons';
import { downloadCsvFiles, importTagsNotesFromCsv } from 'app/inventory/spreadsheets';
import { DropzoneOptions } from 'react-dropzone';
import { DimStore } from 'app/inventory/store-types';
import { DimItemInfo } from 'app/inventory/dim-item-info';

const importCsv: DropzoneOptions['onDrop'] = async (acceptedFiles) => {
  if (acceptedFiles.length < 1) {
    alert(t('Csv.ImportWrongFileType'));
    return;
  }

  if (!confirm(t('Csv.ImportConfirm'))) {
    return;
  }
  try {
    const result = await importTagsNotesFromCsv(acceptedFiles);
    alert(t('Csv.ImportSuccess', { count: result }));
  } catch (e) {
    alert(t('Csv.ImportFailed', { error: e.message }));
  }
};

export default function Spreadsheets({
  stores,
  itemInfos,
  disabled
}: {
  stores: DimStore[];
  itemInfos: { [key: string]: DimItemInfo };
  disabled?: boolean;
}) {
  const downloadCsv = (type: 'Armor' | 'Weapons' | 'Ghost') => {
    downloadCsvFiles(stores, itemInfos, type);
    ga('send', 'event', 'Download CSV', type);
  };

  const downloadWeaponCsv = (e) => {
    e.preventDefault();
    downloadCsv('Weapons');
    return false;
  };

  const downloadArmorCsv = (e) => {
    e.preventDefault();
    downloadCsv('Armor');
    return false;
  };

  const downloadGhostCsv = (e) => {
    e.preventDefault();
    downloadCsv('Ghost');
    return false;
  };

  return (
    <section id="spreadsheets">
      <h2>{t('Settings.Data')}</h2>
      <div className="setting horizontal">
        <label htmlFor="spreadsheetLinks" title={t('Settings.ExportSSHelp')}>
          {t('Settings.ExportSS')}
        </label>
        <div>
          <button className="dim-button" onClick={downloadWeaponCsv} disabled={disabled}>
            <AppIcon icon={spreadsheetIcon} /> <span>{t('Bucket.Weapons')}</span>
          </button>{' '}
          <button className="dim-button" onClick={downloadArmorCsv} disabled={disabled}>
            <AppIcon icon={spreadsheetIcon} /> <span>{t('Bucket.Armor')}</span>
          </button>{' '}
          <button className="dim-button" onClick={downloadGhostCsv} disabled={disabled}>
            <AppIcon icon={spreadsheetIcon} /> <span>{t('Bucket.Ghost')}</span>
          </button>
        </div>
      </div>
      <div className="setting">
        <FileUpload title={t('Settings.CsvImport')} accept=".csv" onDrop={importCsv} />
      </div>
    </section>
  );
}
