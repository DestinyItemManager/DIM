import { WithSymbolsPicker } from 'app/dim-ui/destiny-symbols/SymbolsPicker';
import { useAutocomplete } from 'app/dim-ui/text-complete/text-complete';
import { t } from 'app/i18next-t';
import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { Loadout } from '../loadout/loadout-types';
import { loadoutsHashtagsSelector } from '../loadout/selectors';
import * as styles from './LoadoutDrawerHeader.m.scss';

export default function LoadoutDrawerHeader({
  loadout,
  onNameChanged,
}: {
  loadout: Readonly<Loadout>;
  onNameChanged: (name: string) => void;
}) {
  const setName = (e: React.ChangeEvent<HTMLInputElement>) => onNameChanged(e.target.value);
  const inputRef = useRef<HTMLInputElement>(null);

  const tags = useSelector(loadoutsHashtagsSelector);
  useAutocomplete(inputRef, tags);

  return (
    <WithSymbolsPicker className={styles.dimInput} input={inputRef} setValue={onNameChanged}>
      <input
        name="name"
        ref={inputRef}
        onChange={setName}
        minLength={1}
        maxLength={50}
        required={true}
        autoComplete="off"
        type="text"
        value={loadout.name}
        placeholder={t('Loadouts.LoadoutName')}
      />
    </WithSymbolsPicker>
  );
}
