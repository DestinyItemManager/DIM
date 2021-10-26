import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { DimItem } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Abilities from './Abilities';
import AspectAndFragmentDrawer from './AspectAndFragmentDrawer';
import Aspects from './Aspects';
import styles from './SubclassOptions.m.scss';
import { SelectedPlugs, SocketWithOptions } from './types';

export default function SubclassOptions({
  selectedSubclass,
  defs,
  selectedPlugs,
  setSelectedPlugs,
}: {
  selectedSubclass: DimItem;
  defs: D2ManifestDefinitions;
  selectedPlugs: SelectedPlugs;
  setSelectedPlugs(selectedPlugs: SelectedPlugs): void;
}) {
  const [showPlugPicker, setShowPlugPicker] = useState(false);

  const abilities = getSocketsWithOptionsForCategory(
    defs,
    selectedSubclass,
    SocketCategoryHashes.Abilities
  );
  const superPlug = getSuperPlug(defs, selectedSubclass, SocketCategoryHashes.Super);
  const aspects = getSocketsWithOptionsForCategory(
    defs,
    selectedSubclass,
    SocketCategoryHashes.Aspects
  );
  const fragments = getSocketsWithOptionsForCategory(
    defs,
    selectedSubclass,
    SocketCategoryHashes.Fragments
  );

  const aspectsPlugCategoryHash = aspects.length && aspects[0].plugCategoryHash;
  const fragmentPlugCategoryHash = fragments.length && fragments[0].plugCategoryHash;

  const maxFragments =
    (aspectsPlugCategoryHash &&
      _.sumBy(
        selectedPlugs[aspectsPlugCategoryHash],
        (aspect) => aspect.plug.energyCapacity?.capacityValue || 0
      )) ||
    0;

  return (
    <div className={styles.optionsGrid}>
      {superPlug && (
        <div className={styles.super}>
          <div className={styles.superImage}>
            <svg viewBox="0 0 94 94">
              <image
                xlinkHref={bungieNetPath(superPlug.displayProperties.icon)}
                width="94"
                height="94"
              />

              <polygon
                strokeDasharray="265.87216"
                style={{ strokeDashoffset: 0 }}
                fillOpacity="0"
                stroke="#979797"
                strokeWidth="1"
                points="47,0 94,47 47,94 0,47"
                strokeLinecap="butt"
              />
            </svg>
          </div>
        </div>
      )}
      <div className={styles.abilities}>
        <Abilities
          abilities={abilities}
          selectedPlugs={selectedPlugs}
          setSelectedPlugs={setSelectedPlugs}
        />
      </div>
      <div className={styles.aspects}>
        <Aspects
          aspects={aspects}
          selectedPlugs={selectedPlugs}
          setSelectedPlugs={setSelectedPlugs}
          onOpenPlugPicker={() => setShowPlugPicker(true)}
        />
      </div>
      <div className={styles.fragments}>
        <Aspects
          aspects={fragments}
          selectedPlugs={selectedPlugs}
          maxSelectable={maxFragments}
          setSelectedPlugs={setSelectedPlugs}
          onOpenPlugPicker={() => setShowPlugPicker(true)}
        />
      </div>
      {showPlugPicker &&
        ReactDOM.createPortal(
          <AspectAndFragmentDrawer
            aspects={aspects}
            fragments={fragments}
            selectedPlugs={selectedPlugs}
            onAccept={(selected) => {
              const groupedPlugs = _.groupBy(selected, (plug) => plug.plug.plugCategoryHash);
              const newPlugs = { ...selectedPlugs };
              for (const plugCategoryHash of [aspectsPlugCategoryHash, fragmentPlugCategoryHash]) {
                if (plugCategoryHash) {
                  newPlugs[plugCategoryHash] = groupedPlugs[plugCategoryHash];
                }
              }
              setSelectedPlugs(newPlugs);
            }}
            onClose={() => setShowPlugPicker(false)}
          />,
          document.body
        )}
    </div>
  );
}

function getSocketsWithOptionsForCategory(
  defs: D2ManifestDefinitions,
  subclass: DimItem,
  categoryHash: SocketCategoryHashes
) {
  const rtn: SocketWithOptions[] = [];
  const title = defs.SocketCategory.get(categoryHash).displayProperties.name;
  const indexes =
    subclass.sockets?.categories.find((category) => category.category.hash === categoryHash)
      ?.socketIndexes || [];
  for (const index of indexes) {
    const socket = subclass.sockets?.allSockets[index];
    const plugSetHash = socket?.socketDefinition.reusablePlugSetHash;

    if (plugSetHash) {
      const plugSet = plugSetHash !== undefined ? defs.PlugSet.get(plugSetHash) : undefined;
      const options = plugSet?.reusablePlugItems
        ?.map((plugItem) => defs.InventoryItem.get(plugItem.plugItemHash))
        .filter(isPluggableItem);

      if (socket && options?.length) {
        const { plugCategoryHash } = options[0].plug;
        rtn.push({ title, socket, options, plugCategoryHash });
      }
    }
  }
  return rtn;
}

function getSuperPlug(
  defs: D2ManifestDefinitions,
  subclass: DimItem,
  categoryHash: SocketCategoryHashes
) {
  const indexes =
    subclass.sockets?.categories.find((category) => category.category.hash === categoryHash)
      ?.socketIndexes || [];
  for (const index of indexes) {
    const socket = subclass.sockets?.allSockets[index];
    const initialItemHash = socket?.socketDefinition.singleInitialItemHash;
    return initialItemHash && defs.InventoryItem.get(initialItemHash);
  }
}
