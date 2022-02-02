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
  onAddFromEquipped,
  onAddFromInventory,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  onClear(): void;
  onAddFromEquipped(): void;
  onAddFromInventory?(): void;
}) {
  const options: Option[] = _.compact([
    {
      key: 'addFromEquipped',
      onSelected: onAddFromEquipped,
      content: (
        <>
          <AppIcon icon={downloadIcon} /> {t('Loadouts.SyncFromEquipped')}
        </>
      ),
    },
    onAddFromInventory
      ? {
          key: 'addFromInventory',
          onSelected: onAddFromInventory,
          content: (
            <>
              <AppIcon icon={downloadIcon} /> {t('Loadouts.SyncFromInventory')}
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
  ]);

  return (
    <div className={clsx(styles.section, className)}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <Dropdown kebab options={options} />
      </div>
      {children}
    </div>
  );
}
