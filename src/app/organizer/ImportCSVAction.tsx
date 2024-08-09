import useConfirm from 'app/dim-ui/useConfirm';
import { t } from 'app/i18next-t';
import { importTagsNotesFromCsv } from 'app/inventory/spreadsheets';
import { showNotification } from 'app/notifications/notifications';
import { AppIcon, uploadIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { errorMessage } from 'app/utils/errors';
import Dropzone, { DropzoneOptions } from 'react-dropzone';

export default function ImportCSVAction({ className }: { className?: string }) {
  const dispatch = useThunkDispatch();
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

  return (
    <Dropzone onDrop={importCsv} accept={{ 'text/csv': ['.csv'] }} useFsAccessApi={false}>
      {({ getRootProps, getInputProps }) => (
        <div {...getRootProps()} className={className}>
          <input {...getInputProps()} />
          <div className="dim-button">
            <AppIcon icon={uploadIcon} /> {t('Settings.CsvImport')}
          </div>
          {confirmDialog}
        </div>
      )}
    </Dropzone>
  );
}
