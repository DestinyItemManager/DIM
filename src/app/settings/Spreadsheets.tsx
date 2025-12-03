import FileUpload from 'app/dim-ui/FileUpload';
import useConfirm from 'app/dim-ui/useConfirm';
import { t } from 'app/i18next-t';
import { storesLoadedSelector } from 'app/inventory/selectors';
import { downloadCsvFiles, importTagsNotesFromCsv } from 'app/inventory/spreadsheets';
import { downloadLoadoutsCsv } from 'app/loadout/spreadsheets';
import { useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { errorMessage } from 'app/utils/errors';
import { DropzoneOptions } from 'react-dropzone';
import { useSelector } from 'react-redux';
import { AppIcon, spreadsheetIcon } from '../shell/icons';
import { settingClass } from './SettingsPage';
import * as styles from './Spreadsheets.m.scss';

export default function Spreadsheets() {
  const dispatch = useThunkDispatch();
  const disabled = !useSelector(storesLoadedSelector);
  const d2Defs = useD2Definitions();

  const [confirmDialog, confirm] = useConfirm();
  const importCsv: DropzoneOptions['onDrop'] = async (acceptedFiles) => {
    if (acceptedFiles.length < 1) {
      showNotification({ type: 'error', title: t('Csv.ImportWrongFileType') });
      return;
    }

    if (!(await confirm(t('Csv.ImportConfirm')))) {
      return;
    }
    try {
      const result = await dispatch(importTagsNotesFromCsv(acceptedFiles));
      showNotification({ type: 'success', title: t('Csv.ImportSuccess', { count: result }) });
    } catch (e) {
      showNotification({ type: 'error', title: t('Csv.ImportFailed', { error: errorMessage(e) }) });
    }
  };

  const downloadCsv = (type: 'armor' | 'weapon' | 'ghost') => dispatch(downloadCsvFiles(type));

  return (
    <section id="spreadsheets">
      {confirmDialog}
      <h2>{t('Settings.Data')}</h2>
      <div className={settingClass}>
        <label htmlFor="spreadsheetLinks" title={t('Settings.ExportSSHelp')}>
          {t('Settings.ExportSS')}
        </label>
        <div className={styles.buttons}>
          <button
            type="button"
            className="dim-button"
            onClick={() => downloadCsv('weapon')}
            disabled={disabled}
          >
            <AppIcon icon={spreadsheetIcon} /> <span>{t('Bucket.Weapons')}</span>
          </button>{' '}
          <button
            type="button"
            className="dim-button"
            onClick={() => downloadCsv('armor')}
            disabled={disabled}
          >
            <AppIcon icon={spreadsheetIcon} /> <span>{t('Bucket.Armor')}</span>
          </button>{' '}
          <button
            type="button"
            className="dim-button"
            onClick={() => downloadCsv('ghost')}
            disabled={disabled}
          >
            <AppIcon icon={spreadsheetIcon} /> <span>{t('Bucket.Ghost')}</span>
          </button>
        </div>
        <FileUpload
          title={t('Settings.CsvImport')}
          accept={{ 'text/csv': ['.csv'] }}
          onDrop={importCsv}
        />
      </div>
      {d2Defs && (
        <div className={settingClass}>
          <label htmlFor="spreadsheetLinks" title={t('Settings.ExportLoadoutSSHelp')}>
            {t('Settings.ExportLoadoutSS')}
          </label>
          <div>
            <button
              type="button"
              className="dim-button"
              onClick={() => dispatch(downloadLoadoutsCsv())}
              disabled={disabled}
            >
              <AppIcon icon={spreadsheetIcon} /> <span>{t('Loadouts.Loadouts')}</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
