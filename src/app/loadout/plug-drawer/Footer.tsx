import { useHotkey } from 'app/hotkeys/useHotkey';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import React, { ComponentType, PropsWithChildren } from 'react';
import PlugDef from '../loadout-ui/PlugDef';
import { createGetModRenderKey } from '../mod-utils';
import styles from './Footer.m.scss';
import { PlugSet } from './types';

interface Props {
  isPhonePortrait: boolean;
  plugSets: PlugSet[];
  acceptButtonText: string;
  onSubmit: (event: React.FormEvent | KeyboardEvent) => void;
  handlePlugSelected: (plug: PluggableInventoryItemDefinition) => void;
  HorizontalScroller: ComponentType<PropsWithChildren>;
}

export default function Footer({
  isPhonePortrait,
  plugSets,
  acceptButtonText,
  onSubmit,
  handlePlugSelected,
  HorizontalScroller,
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
        <HorizontalScroller>
          {plugSets.flatMap((plugSet) =>
            plugSet.selected.map((plug) => (
              <PlugDef
                key={getModRenderKey(plug)}
                plug={plug}
                onClose={
                  plugSet.selectionType === 'multi' ? () => handlePlugSelected(plug) : undefined
                }
              />
            ))
          )}
        </HorizontalScroller>
      </div>
    </div>
  );
}
