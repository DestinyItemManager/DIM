import { useHotkey } from 'app/hotkeys/useHotkey';
import { PluggableInventoryItemDefinition } from 'app/inventory-stores/item-types';
import React from 'react';
import PlugDef from '../loadout-ui/PlugDef';
import { createGetModRenderKey } from '../mod-utils';
import styles from './Footer.m.scss';

interface Props {
  isPhonePortrait: boolean;
  selected: { plug: PluggableInventoryItemDefinition; selectionType: 'multi' | 'single' }[];
  acceptButtonText: string;
  onSubmit(event: React.FormEvent | KeyboardEvent): void;
  handlePlugSelected(plug: PluggableInventoryItemDefinition): void;
}

export default function Footer({
  isPhonePortrait,
  selected,
  acceptButtonText,
  onSubmit,
  handlePlugSelected,
}: Props) {
  useHotkey('enter', acceptButtonText, onSubmit);
  const getModRenderKey = createGetModRenderKey();

  return (
    <div className={styles.footer}>
      <div>
        <button type="button" className={styles.submitButton} onClick={onSubmit}>
          {!isPhonePortrait && '⏎ '}
          {acceptButtonText}
        </button>
      </div>
      <div className={styles.selectedPlugs}>
        {selected.map((s) => (
          <PlugDef
            key={getModRenderKey(s.plug)}
            plug={s.plug}
            onClose={s.selectionType === 'multi' ? () => handlePlugSelected(s.plug) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
