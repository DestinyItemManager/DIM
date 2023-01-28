import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import { t } from 'app/i18next-t';
import { AppIcon, clearIcon, downloadIcon } from 'app/shell/icons';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import styles from './LoadoutEditSection.m.scss';

export default function LoadoutEditSection({
  title,
  children,
  className,
  onClear,
  onFillFromEquipped,
  onSyncFromEquipped,
  fillFromInventoryCount,
  onFillFromInventory,
  onClearLoadoutParameters,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  onClear: () => void;
  onFillFromEquipped?: () => void;
  onSyncFromEquipped?: () => void;
  fillFromInventoryCount?: number;
  onFillFromInventory?: () => void;
  onClearLoadoutParameters?: () => void;
}) {
  const options: Option[] = _.compact([
    onFillFromEquipped
      ? {
          key: 'fillFromEquipped',
          onSelected: onFillFromEquipped,
          content: (
            <>
              <AppIcon icon={downloadIcon} /> {t('Loadouts.FillFromEquipped')}
            </>
          ),
        }
      : undefined,
    onSyncFromEquipped
      ? {
          key: 'syncFromEquipped',
          onSelected: onSyncFromEquipped,
          content: (
            <>
              <AppIcon icon={downloadIcon} /> {t('Loadouts.SyncFromEquipped')}
            </>
          ),
        }
      : undefined,
    onFillFromInventory
      ? {
          key: 'fillFromInventory',
          onSelected: onFillFromInventory,
          content: (
            <>
              <AppIcon icon={downloadIcon} /> {t('Loadouts.FillFromInventory')}
              {fillFromInventoryCount !== undefined && ` (${fillFromInventoryCount})`}
            </>
          ),
        }
      : undefined,
    {
      key: 'clear',
      onSelected: onClear,
      content: (
        <>
          <AppIcon icon={clearIcon} /> {t('Loadouts.ClearSection')}
        </>
      ),
    },
    onClearLoadoutParameters
      ? {
          key: 'clearLoadoutParameters',
          onSelected: onClearLoadoutParameters,
          content: (
            <>
              <AppIcon icon={clearIcon} /> {t('Loadouts.ClearLoadoutParameters')}
            </>
          ),
        }
      : undefined,
  ]);

  return (
    <div className={clsx(styles.section, className)}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <Dropdown kebab options={options} placement="bottom-end" />
      </div>
      {children}
    </div>
  );
}
