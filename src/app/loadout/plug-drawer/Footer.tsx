import { SheetHorizontalScrollContainer } from 'app/dim-ui/SheetHorizontalScrollContainer';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import React from 'react';
import PlugDef from '../loadout-ui/PlugDef';
import { createGetModRenderKey } from '../mod-utils';
import styles from './Footer.m.scss';
import { PlugSelectionType, PlugSet } from './types';

interface Props {
  isPhonePortrait: boolean;
  plugSets: PlugSet[];
  classType: DestinyClass;
  acceptButtonText: string;
  onSubmit: (event: React.FormEvent | KeyboardEvent) => void;
  handlePlugSelected: (plug: PluggableInventoryItemDefinition) => void;
}

export default function Footer({
  isPhonePortrait,
  plugSets,
  classType,
  acceptButtonText,
  onSubmit,
  handlePlugSelected,
}: Props) {
  useHotkey('enter', acceptButtonText, onSubmit);
  const getModRenderKey = createGetModRenderKey();

  return (
    <div className={styles.footer}>
      <button type="button" className={styles.submitButton} onClick={onSubmit}>
        {!isPhonePortrait && '⏎ '}
        {acceptButtonText}
      </button>
      <SheetHorizontalScrollContainer className={styles.selectedPlugs}>
        {plugSets.flatMap((plugSet) =>
          plugSet.selected.map((plug) => (
            <PlugDef
              key={getModRenderKey(plug)}
              plug={plug}
              onClose={
                plugSet.selectionType !== PlugSelectionType.Single
                  ? () => handlePlugSelected(plug)
                  : undefined
              }
              forClassType={classType}
            />
          )),
        )}
      </SheetHorizontalScrollContainer>
    </div>
  );
}
