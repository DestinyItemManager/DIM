import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import {
  AppIcon,
  clearIcon,
  disabledIcon,
  downloadIcon,
  faRandom,
  helpIcon,
} from 'app/shell/icons';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import styles from './LoadoutEditSection.m.scss';

export default function LoadoutEditSection({
  title,
  titleInfo,
  children,
  className,
  onClear,
  onFillFromEquipped,
  fillFromEquippedDisabled,
  onSyncFromEquipped,
  onRandomize,
  hasRandomizeQuery,
  fillFromInventoryCount,
  onFillFromInventory,
  onClearLoadoutParameters,
}: {
  title: string;
  titleInfo?: string;
  children: React.ReactNode;
  className?: string;
  onClear: () => void;
  onFillFromEquipped?: () => void;
  fillFromEquippedDisabled?: boolean;
  onSyncFromEquipped?: () => void;
  onRandomize?: () => void;
  hasRandomizeQuery?: boolean;
  fillFromInventoryCount?: number;
  onFillFromInventory?: () => void;
  onClearLoadoutParameters?: () => void;
}) {
  const options: Option[] = _.compact([
    onFillFromEquipped
      ? {
          key: 'fillFromEquipped',
          onSelected: onFillFromEquipped,
          disabled: fillFromEquippedDisabled,
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
    onRandomize
      ? {
          key: 'randomize',
          onSelected: onRandomize,
          content: (
            <>
              <AppIcon icon={faRandom} />{' '}
              {!hasRandomizeQuery ? t('Loadouts.RandomizeButton') : t('Loadouts.RandomizeSearch')}
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
    <div className={clsx(className)}>
      <div className={styles.header}>
        <div className={styles.title}>
          <h3>{title}</h3>
          {titleInfo !== undefined && (
            <PressTip tooltip={titleInfo}>
              <AppIcon icon={helpIcon} />
            </PressTip>
          )}
        </div>
        {onClear && (
          <button
            type="button"
            className={styles.clear}
            onClick={onClear}
            title={t('Loadouts.ClearSection')}
          >
            <AppIcon icon={disabledIcon} />
          </button>
        )}
        <Dropdown label={t('Loadouts.Actions', { title })} kebab options={options} />
      </div>
      {children}
    </div>
  );
}
