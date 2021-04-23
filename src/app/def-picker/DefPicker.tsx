import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import Sheet from 'app/dim-ui/Sheet';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { RootState } from 'app/store/types';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import React from 'react';
import { connect } from 'react-redux';
import styles from './DefPicker.m.scss';

interface ProvidedProps {
  hashes: number[];
  title: string;
  onDefintionSelected(def: DestinyInventoryItemDefinition): void;
  onClose(): void;
}

interface StoreProps {
  defs?: D2ManifestDefinitions;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    defs: state.manifest.d2Manifest,
  };
}

type Props = ProvidedProps & StoreProps;

function DefPicker({ defs, title, hashes, onDefintionSelected, onClose }: Props) {
  const visibleDefs: DestinyInventoryItemDefinition[] = [];

  for (const hash of hashes) {
    const def = defs?.InventoryItem.get(hash);

    if (def?.displayProperties.hasIcon) {
      visibleDefs.push(def);
    }
  }

  return (
    <Sheet
      header={
        <div>
          <h1>{title}</h1>
        </div>
      }
      onClose={onClose}
      freezeInitialHeight={true}
    >
      {({ onClose }) => (
        <div className="sub-bucket">
          {visibleDefs.map((def) => (
            <div
              key={def.hash}
              className={styles.defIcon}
              onClick={() => {
                onDefintionSelected(def);
                onClose();
              }}
            >
              <DefItemIcon itemDef={def} />
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(DefPicker);
