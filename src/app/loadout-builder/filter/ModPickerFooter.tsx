import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import React from 'react';
import { getModRenderKey } from '../mod-utils';
import LockedModIcon from './LockedModIcon';
import styles from './ModPickerFooter.m.scss';

interface Props {
  isPhonePortrait: boolean;
  lockedModsInternal: PluggableInventoryItemDefinition[];
  onSubmit(event: React.FormEvent | KeyboardEvent): void;
  onModSelected(item: PluggableInventoryItemDefinition): void;
}

function ModPickerFooter({ isPhonePortrait, lockedModsInternal, onSubmit, onModSelected }: Props) {
  useHotkey('enter', t('LB.SelectMods'), onSubmit);

  // used for creating unique keys for the mods
  const modCounts = {};

  return (
    <div className={styles.footer}>
      <div>
        <button type="button" className={styles.submitButton} onClick={onSubmit}>
          {!isPhonePortrait && '⏎ '}
          {t('LB.SelectMods')}
        </button>
      </div>
      <div className={styles.selectedMods}>
        {lockedModsInternal.map((mod) => (
          <LockedModIcon
            key={getModRenderKey(mod, modCounts)}
            mod={mod}
            onModClicked={() => onModSelected(mod)}
          />
        ))}
      </div>
    </div>
  );
}

export default ModPickerFooter;
