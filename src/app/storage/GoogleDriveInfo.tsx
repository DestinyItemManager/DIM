import React from 'react';
import { DriveAboutResource } from './google-drive-storage';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import { percent } from '../shell/filters';

export function GoogleDriveInfo({ driveInfo }: { driveInfo: DriveAboutResource }) {
  return (
    <div>
      <div className="google-user">
        {driveInfo.user.photoLink && <img src={driveInfo.user.photoLink} />}
        {driveInfo.user.displayName && <div>{driveInfo.user.displayName}</div>}
        {driveInfo.user.emailAddress && <div>{driveInfo.user.emailAddress}</div>}
      </div>
      <div className="storage-guage">
        <div
          className={clsx({
            full:
              driveInfo.storageQuota.usage /
                (driveInfo.storageQuota.limit || Number.MAX_SAFE_INTEGER) >
              0.9
          })}
          style={{
            width: percent(
              driveInfo.storageQuota.usage /
                (driveInfo.storageQuota.limit || Number.MAX_SAFE_INTEGER)
            )
          }}
        />
        {driveInfo.storageQuota.dimQuotaUsed && (
          <div
            className="dim-usage"
            style={{
              width: percent(
                driveInfo.storageQuota.dimQuotaUsed /
                  (driveInfo.storageQuota.limit || Number.MAX_SAFE_INTEGER)
              )
            }}
          />
        )}
      </div>
      <p>
        {driveInfo.storageQuota.limit
          ? driveInfo.storageQuota.dimQuotaUsed
            ? t('Storage.GoogleDriveUsage', driveInfo.storageQuota)
            : t('Storage.GoogleDriveUsageNoFile', driveInfo.storageQuota)
          : t('Storage.GoogleDriveUsageUnlimited', driveInfo.storageQuota)}
      </p>
    </div>
  );
}
