import { AssumeArmorMasterwork, LockArmorEnergyType } from '@destinyitemmanager/dim-api-types';
import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import React, { Dispatch, useMemo } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import styles from './EnergyOptions.m.scss';

interface Option {
  label: string;
  tooltip: string;
  selected: boolean;
  onClick(): void;
}

const RadioSetting = React.memo(function RadioSetting({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: Option[];
}) {
  return (
    <div className={styles.settingGroup}>
      <div className={styles.title}>{label}</div>
      <div className={styles.buttons}>
        {options.map(({ label, selected, tooltip, onClick }) => (
          <RadioButton
            key={label}
            label={label}
            tooltip={tooltip}
            selected={selected}
            onClick={onClick}
            name={name}
          />
        ))}
      </div>
    </div>
  );
});

function RadioButton({ label, tooltip, name, selected, onClick }: Option & { name: string }) {
  return (
    <PressTip
      tooltip={tooltip}
      elementType="label"
      className={clsx(styles.button, {
        [styles.selected]: selected,
      })}
    >
      <input type="radio" name={name} checked={selected} onClick={onClick} />
      {label}
    </PressTip>
  );
}

export default function EnergyOptions({
  assumeArmorMasterwork,
  lockArmorEnergyType,
  lbDispatch,
}: {
  assumeArmorMasterwork: AssumeArmorMasterwork | undefined;
  lockArmorEnergyType: LockArmorEnergyType | undefined;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const lockEnergyOptions: Option[] = useMemo(
    () => [
      {
        label: t('LoadoutBuilder.None'),
        tooltip: t('LoadoutBuilder.LockElementOptions.None'),
        selected: !lockArmorEnergyType,
        onClick: () => {
          if (lockArmorEnergyType) {
            lbDispatch({
              type: 'lockArmorEnergyTypeChanged',
              lockArmorEnergyType: undefined,
            });
          }
        },
      },
      {
        label: t('LoadoutBuilder.Masterworked'),
        tooltip: t('LoadoutBuilder.LockElementOptions.Masterworked'),
        selected: lockArmorEnergyType === LockArmorEnergyType.Masterworked,
        onClick: () => {
          if (lockArmorEnergyType !== LockArmorEnergyType.Masterworked) {
            lbDispatch({
              type: 'lockArmorEnergyTypeChanged',
              lockArmorEnergyType: LockArmorEnergyType.Masterworked,
            });
          }
        },
      },
      {
        label: t('LoadoutBuilder.All'),
        tooltip: t('LoadoutBuilder.LockElementOptions.All'),
        selected: lockArmorEnergyType === LockArmorEnergyType.All,
        onClick: () => {
          if (lockArmorEnergyType !== LockArmorEnergyType.All) {
            lbDispatch({
              type: 'lockArmorEnergyTypeChanged',
              lockArmorEnergyType: LockArmorEnergyType.All,
            });
          }
        },
      },
    ],
    [lbDispatch, lockArmorEnergyType]
  );

  const assumeMasterworkOptions: Option[] = useMemo(
    () => [
      {
        label: t('LoadoutBuilder.None'),
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.None'),
        selected: !assumeArmorMasterwork,
        onClick: () => {
          if (assumeArmorMasterwork) {
            lbDispatch({
              type: 'assumeArmorMasterworkChanged',
              assumeArmorMasterwork: undefined,
            });
          }
        },
      },
      {
        label: t('LoadoutBuilder.Legendary'),
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.Legendary'),
        selected: assumeArmorMasterwork === AssumeArmorMasterwork.Legendary,
        onClick: () => {
          if (assumeArmorMasterwork !== AssumeArmorMasterwork.Legendary) {
            lbDispatch({
              type: 'assumeArmorMasterworkChanged',
              assumeArmorMasterwork: AssumeArmorMasterwork.Legendary,
            });
          }
        },
      },
      {
        label: t('LoadoutBuilder.All'),
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.All'),
        selected: assumeArmorMasterwork === AssumeArmorMasterwork.All,
        onClick: () => {
          if (assumeArmorMasterwork !== AssumeArmorMasterwork.All) {
            lbDispatch({
              type: 'assumeArmorMasterworkChanged',
              assumeArmorMasterwork: AssumeArmorMasterwork.All,
            });
          }
        },
      },
    ],
    [assumeArmorMasterwork, lbDispatch]
  );

  return (
    <div className={styles.energyOptions}>
      <RadioSetting
        name="lockElement"
        label={t('LoadoutBuilder.LockElement')}
        options={lockEnergyOptions}
      />
      <RadioSetting
        name="assumeMasterwork"
        label={t('LoadoutBuilder.AssumeMasterwork')}
        options={assumeMasterworkOptions}
      />
    </div>
  );
}
