import { t } from 'app/i18next-t';
import { AppIcon, uploadIcon } from 'app/shell/icons';
import clsx from 'clsx';
import Dropzone, { DropzoneOptions } from 'react-dropzone';
import styles from './FileUpload.m.scss';

export default function FileUpload({
  accept,
  title,
  onDrop,
}: {
  accept?: DropzoneOptions['accept'];
  title: string;
  onDrop: DropzoneOptions['onDrop'];
}) {
  return (
    <Dropzone onDrop={onDrop} accept={accept} useFsAccessApi={false}>
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div
          {...getRootProps()}
          className={clsx(styles.fileInput, { [styles.dragActive]: isDragActive })}
        >
          <input {...getInputProps()} />
          <div className="dim-button">
            <AppIcon icon={uploadIcon} /> {title}
          </div>
          <div className={styles.instructions}>{t('FileUpload.Instructions')}</div>
        </div>
      )}
    </Dropzone>
  );
}
