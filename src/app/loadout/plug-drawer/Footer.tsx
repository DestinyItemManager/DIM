import { useHotkey } from 'app/hotkeys/useHotkey';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import React from 'react';
import LockedModIcon from '../loadout-ui/LockedModIcon';
import { getModRenderKey } from '../mod-utils';
import styles from './Footer.m.scss';

interface Props {
  isPhonePortrait: boolean;
  selected: PluggableInventoryItemDefinition[];
  acceptButtonText: string;
  onSubmit(event: React.FormEvent | KeyboardEvent): void;
  onPlugSelected(plug: PluggableInventoryItemDefinition): void;
}

export default function Footer({
  isPhonePortrait,
  selected,
  acceptButtonText,
  onSubmit,
  onPlugSelected,
}: Props) {
  useHotkey('enter', acceptButtonText, onSubmit);

  // used for creating unique keys for the mods
  const plugCounts = {};

  return (
    <div className={styles.footer}>
      <div>
        <button type="button" className={styles.submitButton} onClick={onSubmit}>
          {!isPhonePortrait && '⏎ '}
          {acceptButtonText}
        </button>
      </div>
      <div className={styles.selectedMods}>
        {selected.map((plug) => (
          <LockedModIcon
            key={getModRenderKey(plug, plugCounts)}
            mod={plug}
            onModClicked={() => onPlugSelected(plug)}
          />
        ))}
      </div>
    </div>
  );
}
