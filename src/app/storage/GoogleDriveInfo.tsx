import * as React from 'react';
import { DriveAboutResource } from './google-drive-storage';
import { percent } from '../inventory/dimPercentWidth.directive';
import { t } from 'i18next';
import classNames from 'classnames';

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
          className={classNames({
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
        {t(
          driveInfo.storageQuota.limit
            ? driveInfo.storageQuota.dimQuotaUsed
              ? 'Storage.GoogleDriveUsage'
              : 'Storage.GoogleDriveUsageNoFile'
            : 'Storage.GoogleDriveUsageUnlimited',
          driveInfo.storageQuota
        )}
      </p>
    </div>
  );
}
