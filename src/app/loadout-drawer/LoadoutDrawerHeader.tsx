import ClassIcon from 'app/dim-ui/ClassIcon';
import { WithSymbolsPicker } from 'app/dim-ui/destiny-symbols/SymbolsPicker';
import { useAutocomplete } from 'app/dim-ui/text-complete/text-complete';
import { t } from 'app/i18next-t';
import InGameLoadoutIconSelectButton from 'app/loadout/ingame/InGameLoadoutIconSelectButton';
import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import styles from './LoadoutDrawerHeader.m.scss';
import { Loadout } from './loadout-types';
import { loadoutsHashtagsSelector } from './selectors';

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

  // TODO: Only show the ingame loadout icon when the loadout has some ingame-loadout-compatible items in it?
  // TODO: preview/warn that an incomplete loadout will inherit the current items for any missing slots

  return (
    <div className={styles.loadoutName}>
      <InGameLoadoutIconSelectButton loadout={loadout} />
      <ClassIcon classType={loadout.classType} />
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
    </div>
  );
}
