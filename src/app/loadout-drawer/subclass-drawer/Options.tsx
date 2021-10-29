import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { DimItem } from 'app/inventory/item-types';
import { profileResponseSelector } from 'app/inventory/selectors';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { plugIsInsertable } from 'app/item-popup/SocketDetails';
import { itemsForPlugSet } from 'app/records/plugset-helpers';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import Abilities from './Abilities';
import AspectAndFragmentDrawer from './AspectAndFragmentDrawer';
import Mods from './Mods';
import styles from './Options.m.scss';
import { SDDispatch } from './reducer';
import { SelectedPlugs, SocketWithOptions } from './types';

export default function Options({
  selectedSubclass,
  defs,
  selectedPlugs,
  dispatch,
}: {
  selectedSubclass: DimItem;
  defs: D2ManifestDefinitions;
  selectedPlugs: SelectedPlugs;
  dispatch: SDDispatch;
}) {
  const [showPlugPicker, setShowPlugPicker] = useState(false);
  const isPhonePortrait = useIsPhonePortrait();
  const profileResponse = useSelector(profileResponseSelector);

  const { abilities, superPlug, aspects, fragments } = useMemo(() => {
    const abilities = getSocketsWithOptionsForCategory(
      defs,
      profileResponse,
      selectedSubclass,
      SocketCategoryHashes.Abilities
    );
    const superPlug = getSuperPlug(defs, selectedSubclass, SocketCategoryHashes.Super);
    const aspects = getSocketsWithOptionsForCategory(
      defs,
      profileResponse,
      selectedSubclass,
      SocketCategoryHashes.Aspects
    );
    const fragments = getSocketsWithOptionsForCategory(
      defs,
      profileResponse,
      selectedSubclass,
      SocketCategoryHashes.Fragments
    );

    return { abilities, superPlug, aspects, fragments };
  }, [defs, profileResponse, selectedSubclass]);

  const aspectsPlugCategoryHash = aspects.length && aspects[0].plugCategoryHash;

  // The maximum number of fragments is determined by the energy capacity of the selected aspects.
  const maxFragments =
    (aspectsPlugCategoryHash &&
      _.sumBy(
        selectedPlugs[aspectsPlugCategoryHash],
        (aspect) => aspect.plug.energyCapacity?.capacityValue || 0
      )) ||
    0;

  return (
    <div className={styles.optionsGrid}>
      {!isPhonePortrait && superPlug && (
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
        <Abilities abilities={abilities} selectedPlugs={selectedPlugs} dispatch={dispatch} />
      </div>
      <div className={styles.aspects}>
        <Mods
          mods={aspects}
          selectedPlugs={selectedPlugs}
          dispatch={dispatch}
          onOpenPlugPicker={() => setShowPlugPicker(true)}
        />
      </div>
      <div className={styles.fragments}>
        <Mods
          mods={fragments}
          selectedPlugs={selectedPlugs}
          maxSelectable={maxFragments}
          dispatch={dispatch}
          onOpenPlugPicker={() => setShowPlugPicker(true)}
        />
      </div>
      {showPlugPicker &&
        ReactDOM.createPortal(
          <AspectAndFragmentDrawer
            aspects={aspects}
            fragments={fragments}
            selectedPlugs={selectedPlugs}
            dispatch={dispatch}
            onClose={() => setShowPlugPicker(false)}
          />,
          document.body
        )}
    </div>
  );
}

function getSocketsWithOptionsForCategory(
  defs: D2ManifestDefinitions,
  profileResponse: DestinyProfileResponse | undefined,
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

    if (plugSetHash && profileResponse) {
      const plugSetItems = itemsForPlugSet(profileResponse, plugSetHash);

      const options = _.uniqBy(
        plugSetItems
          ?.map((plugItem) => {
            if (plugIsInsertable(plugItem)) {
              return defs.InventoryItem.get(plugItem.plugItemHash);
            }
          })
          .filter(isPluggableItem),
        (option) => option.hash
      );

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
