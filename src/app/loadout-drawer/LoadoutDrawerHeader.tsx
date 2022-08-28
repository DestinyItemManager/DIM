import ClassIcon from 'app/dim-ui/ClassIcon';
import { t } from 'app/i18next-t';
import React from 'react';
import { Loadout } from './loadout-types';
import styles from './LoadoutDrawerHeader.m.scss';

export default function LoadoutDrawerHeader({
  loadout,
  onNameChanged,
}: {
  loadout: Readonly<Loadout>;
  onNameChanged(name: string): void;
}) {
  const setName = (e: React.ChangeEvent<HTMLInputElement>) => onNameChanged(e.target.value);

  return (
    <div className={styles.loadoutName}>
      <ClassIcon classType={loadout.classType} />
      <input
        className={styles.dimInput}
        name="name"
        onChange={setName}
        minLength={1}
        maxLength={50}
        required={true}
        autoComplete="off"
        type="text"
        value={loadout.name}
        placeholder={t('Loadouts.LoadoutName')}
      />
    </div>
  );
}
