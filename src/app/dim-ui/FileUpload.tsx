import * as React from 'react';
import { thumbsUpIcon, AppIcon, uploadIcon } from '../shell/icons';
import Dropzone, { DropFilesEventHandler } from 'react-dropzone';

export default function FileUpload({
  accept,
  title,
  onDrop
}: {
  accept?: string;
  title: string;
  onDrop: DropFilesEventHandler;
}) {
  return (
    <Dropzone onDrop={onDrop} accept={accept}>
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div {...getRootProps()} className="file-input">
          <input {...getInputProps()} />
          <div className="dim-button">
            <AppIcon icon={uploadIcon} /> {title}
          </div>
          {isDragActive && (
            <div className="drag-active">
              <AppIcon icon={thumbsUpIcon} />
            </div>
          )}
        </div>
      )}
    </Dropzone>
  );
}
