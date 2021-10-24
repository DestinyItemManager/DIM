import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import ClassIcon from 'app/dim-ui/ClassIcon';
import Sheet from 'app/dim-ui/Sheet';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { shallowEqual, useSelector } from 'react-redux';
import Abilities from './Abilities';
import AspectAndFragmentDrawer from './AspectAndFragmentDrawer';
import Aspects from './Aspects';
import SocketOptions from './SocketOptions';
import styles from './SubclassDrawer.m.scss';
import { SelectedPlugs, SocketWithOptions } from './types';

export default function SubclassDrawer({
  classType,
  initialSubclass,
  initialPlugs = [],
  onClose,
}: {
  classType: DestinyClass;
  initialSubclass?: DimItem;
  initialPlugs?: PluggableInventoryItemDefinition[];
  onClose(): void;
}) {
  const defs = useD2Definitions();
  const isPhonePortrait = useIsPhonePortrait();
  const allItems = useSelector(allItemsSelector, shallowEqual);
  const [selectedSubclass, setSelectedSubclass] = useState<DimItem | undefined>(initialSubclass);
  const [selectedPlugs, setSelectedPlugs] = useState<SelectedPlugs>(() =>
    _.groupBy(initialPlugs, (item) => item.plug.plugCategoryHash)
  );

  const subclasses = useMemo(() => {
    if (!defs) {
      return [];
    }
    return allItems
      .filter((item) => item.bucket.type === 'Class' && item.classType === classType)
      .map((item) => item);
  }, [allItems, classType, defs]);

  const screenshot =
    !isPhonePortrait &&
    selectedSubclass &&
    defs?.InventoryItem.get(selectedSubclass.hash).screenshot;

  return (
    <Sheet header="Subclass" fillScreen={Boolean(screenshot)} onClose={onClose}>
      <div
        className={styles.container}
        style={
          screenshot && !isPhonePortrait
            ? {
                backgroundImage: `url("${bungieNetPath(screenshot)}")`,
              }
            : undefined
        }
      >
        <div className={styles.subclasses}>
          {subclasses.map((subclass) => (
            <div
              key={subclass.id}
              onClick={() => setSelectedSubclass(subclass)}
              className="loadout-item"
            >
              <ConnectedInventoryItem item={subclass} ignoreSelectedPerks={true} />
              {subclass.type === 'Class' && (
                <ClassIcon classType={subclass.classType} className="loadout-item-class-icon" />
              )}
            </div>
          ))}
        </div>
        {selectedSubclass && defs && (
          <SubclassOptions
            selectedSubclass={selectedSubclass}
            defs={defs}
            selectedPlugs={selectedPlugs}
            setSelectedPlugs={setSelectedPlugs}
          />
        )}
      </div>
    </Sheet>
  );
}

function getSocketsWithOptionsForCategory(
  defs: D2ManifestDefinitions,
  item: DimItem,
  categoryHash: SocketCategoryHashes
) {
  const rtn: SocketWithOptions[] = [];
  const indexes =
    item.sockets?.categories.find((category) => category.category.hash === categoryHash)
      ?.socketIndexes || [];
  for (const index of indexes) {
    const socket = item.sockets?.allSockets[index];
    const plugSetHash = socket?.socketDefinition.reusablePlugSetHash;

    // Non-super case
    if (plugSetHash) {
      const plugSet = plugSetHash !== undefined ? defs.PlugSet.get(plugSetHash) : undefined;
      const options = plugSet?.reusablePlugItems
        ?.map((plugItem) => defs.InventoryItem.get(plugItem.plugItemHash))
        .filter(isPluggableItem);

      if (socket && options?.length) {
        rtn.push({ socket, options });
      }
    } else if (socket) {
      const initialItemHash = socket?.socketDefinition.singleInitialItemHash;
      const initialItem = defs.InventoryItem.get(initialItemHash);
      rtn.push({ socket, options: [initialItem] });
    }
  }
  return rtn;
}

function SubclassOptions({
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
  const supers = getSocketsWithOptionsForCategory(
    defs,
    selectedSubclass,
    SocketCategoryHashes.Super
  );
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

  return (
    <div className={styles.optionsGrid}>
      <div className={styles.super}>
        <SocketOptions socketsWithOptions={supers} direction="row" selectedPlugs={selectedPlugs} />
      </div>
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
              for (const [plugCategoryHash, plugs] of Object.entries(groupedPlugs)) {
                newPlugs[plugCategoryHash] = plugs;
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
