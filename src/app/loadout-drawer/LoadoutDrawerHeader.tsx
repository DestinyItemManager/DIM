import ClassIcon from 'app/dim-ui/ClassIcon';
import { useAutocomplete } from 'app/dim-ui/text-complete/text-complete';
import { t } from 'app/i18next-t';
import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { Loadout } from './loadout-types';
import styles from './LoadoutDrawerHeader.m.scss';
import { loadoutsHashtagsSelector } from './selectors';

export default function LoadoutDrawerHeader({
  loadout,
  onNameChanged,
}: {
  loadout: Readonly<Loadout>;
  onNameChanged(name: string): void;
}) {
  const setName = (e: React.ChangeEvent<HTMLInputElement>) => onNameChanged(e.target.value);

  const ref = useRef<HTMLInputElement>(null);
  const tags = useSelector(loadoutsHashtagsSelector);
  useAutocomplete(ref, tags);

  return (
    <div className={styles.loadoutName}>
      <ClassIcon classType={loadout.classType} />
      <input
        className={styles.dimInput}
        name="name"
        ref={ref}
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
