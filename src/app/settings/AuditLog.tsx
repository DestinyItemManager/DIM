import React, { useState, useEffect } from 'react';
import {
  AuditLogEntry,
  ItemAnnotationLogEntry,
  SettingsLogEntry,
} from '@destinyitemmanager/dim-api-types';
import { getAuditLog } from 'app/dim-api/dim-api';
import { DestinyAccount, PLATFORM_ICONS } from 'app/accounts/destiny-account';
import { accountsSelector } from 'app/accounts/selectors';
import { connect } from 'react-redux';
import { RootState } from 'app/store/types';
import styles from './AuditLog.m.scss';
import { AppIcon } from 'app/shell/icons';
import { t } from 'app/i18next-t';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';

interface StoreProps {
  accounts: readonly DestinyAccount[];
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    accounts: accountsSelector(state),
  };
}

type Props = StoreProps;

/**
 * Shows an audit log of all of the changes you've made (from any app) to your stored DIM API data.
 */
function AuditLog({ accounts }: Props) {
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    getAuditLog().then(setAuditLog);
  }, []);

  if (auditLog.length === 0) {
    return <ShowPageLoading message={t('Loading.AuditLog')} />;
  }

  const findAccount = (logEntry: AuditLogEntry) =>
    logEntry.platformMembershipId
      ? accounts.find(
          (a) =>
            a.membershipId === logEntry.platformMembershipId &&
            a.destinyVersion === logEntry.destinyVersion
        )
      : undefined;

  const payloadEntry = (logEntry: AuditLogEntry) => {
    switch (logEntry.type) {
      case 'tag':
        return <TagAudit payload={logEntry.payload} />;
      case 'settings':
        return <SettingAudit payload={logEntry.payload} />;
      case 'import':
        return t('AuditLog.Import', logEntry.payload);
      case 'delete_loadout':
        return t('AuditLog.DeleteLoadout', { name: logEntry.payload.name });
      case 'loadout':
        return t('AuditLog.Loadout', { name: logEntry.payload.name });
      case 'delete_all':
        return t('AuditLog.DeleteAll');
      case 'tag_cleanup':
        return logEntry.payload.deleted === undefined
          ? t('AuditLog.TagCleanupUnknown')
          : t('AuditLog.TagCleanup', { count: logEntry.payload.deleted });
      default:
        return JSON.stringify((logEntry as any).payload);
    }
  };

  return (
    <div className="dim-page">
      <p>{t('AuditLog.Description')}</p>
      <table className={styles.auditLog}>
        <thead>
          <tr>
            <th>{t('AuditLog.Date')}</th>
            <th>{t('AuditLog.Action')}</th>
            <th>{t('AuditLog.Account')}</th>
            <th>{t('AuditLog.Details')}</th>
            <th>{t('AuditLog.Application')}</th>
          </tr>
        </thead>
        <tbody>
          {auditLog.map((logEntry, index) => (
            <tr key={index}>
              <td>{new Date(logEntry.createdAt!).toLocaleString()}</td>
              <td>{logEntry.type}</td>
              <td>
                <Account account={findAccount(logEntry)} />
              </td>
              <td>{payloadEntry(logEntry)}</td>
              <td>{logEntry.createdBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TagAudit({ payload }: { payload: ItemAnnotationLogEntry['payload'] }) {
  return (
    <>
      {payload.tag !== undefined &&
        (payload.tag ? (
          <div>{t('AuditLog.SetTag', { tag: payload.tag, id: payload.id })}</div>
        ) : (
          <div>{t('AuditLog.RemoveTag', { id: payload.id })}</div>
        ))}
      {payload.notes !== undefined &&
        (payload.notes ? (
          <div>{t('AuditLog.SetNotes', { notes: payload.notes, id: payload.id })}</div>
        ) : (
          <div>{t('AuditLog.RemoveNotes', { id: payload.id })}</div>
        ))}
    </>
  );
}

function SettingAudit({ payload }: { payload: SettingsLogEntry['payload'] }) {
  return (
    <>
      {Object.entries(payload).map(([key, value]) => (
        <div key={key}>
          {t('AuditLog.Setting', { key, value: JSON.stringify(value, undefined, '  ') })}
        </div>
      ))}
    </>
  );
}

function Account({ account }: { account?: DestinyAccount }) {
  if (!account) {
    return null;
  }

  return (
    <div className={styles.account}>
      <div>{account.displayName}</div>
      <div className={styles.accountDetails}>
        <b>{account.destinyVersion === 1 ? 'D1' : 'D2'}</b>
        {account.platforms.map((platformType, index) => (
          <AppIcon
            key={platformType}
            className={index === 0 ? styles.first : ''}
            icon={PLATFORM_ICONS[platformType]}
          />
        ))}
      </div>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(AuditLog);
