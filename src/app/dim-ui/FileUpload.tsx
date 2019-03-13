import * as React from 'react';
import Dropzone, { DropzoneOptions } from 'react-dropzone';
import classNames from 'classnames';
import { t } from 'i18next';
import './FileUpload.scss';

export default function FileUpload({
  accept,
  title,
  onDrop
}: {
  accept?: string;
  title: string;
  onDrop: DropzoneOptions['onDrop'];
}) {
  return (
    <Dropzone onDrop={onDrop} accept={accept}>
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div
          {...getRootProps()}
          className={classNames('file-input', { 'drag-active': isDragActive })}
        >
          <input {...getInputProps()} />
          <div>{title}</div>
          <div className="file-input-instructions">{t('FileUpload.Instructions')}</div>
        </div>
      )}
    </Dropzone>
  );
}
