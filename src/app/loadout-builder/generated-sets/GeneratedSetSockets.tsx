import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { getSpecialtySocketMetadataByPlugCategoryHash } from 'app/utils/item-utils';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import React, { Dispatch } from 'react';
import { LoadoutBuilderAction } from '../loadoutBuilderReducer';
import {
  isModPickerCategory,
  LockedArmor2Mod,
  ModPickerCategories,
  ModPickerCategory,
} from '../types';
import { armor2ModPlugCategoriesTitles } from '../utils';
import GeneratedSetMod from './GeneratedSetMod';
import styles from './GeneratedSetSockets.m.scss';

const undesireablePlugs = [
  PlugCategoryHashes.ArmorSkinsEmpty,
  PlugCategoryHashes.Shader,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance1,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance2,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance3,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance4,
];

interface PlugAndCategory {
  plugDef: PluggableInventoryItemDefinition;
  category?: ModPickerCategory;
  season?: number;
}

interface Props {
  item: DimItem;
  lockedMods: LockedArmor2Mod[];
  defs: D2ManifestDefinitions;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}

function GeneratedSetSockets({ item, lockedMods, defs, lbDispatch }: Props) {
  if (!item.isDestiny2()) {
    return null;
  }

  const modsAndPerks: PlugAndCategory[] = [];
  const modsToUse = [...lockedMods];

  for (const socket of item.sockets?.allSockets || []) {
    const socketType = defs.SocketType.get(socket.socketDefinition.socketTypeHash);
    let toSave: DestinyInventoryItemDefinition | undefined;

    for (let modIndex = 0; modIndex < modsToUse.length; modIndex++) {
      const mod = modsToUse[modIndex].mod;
      if (
        socketType.plugWhitelist.some((plug) => plug.categoryHash === mod.plug.plugCategoryHash)
      ) {
        toSave = mod;
        modsToUse.splice(modIndex, 1);
      }
    }

    if (!toSave && socket.socketDefinition.singleInitialItemHash) {
      toSave = defs.InventoryItem.get(socket.socketDefinition.singleInitialItemHash);
    }

    if (
      toSave &&
      isPluggableItem(toSave) &&
      !undesireablePlugs.includes(toSave.plug.plugCategoryHash)
    ) {
      const metadata = getSpecialtySocketMetadataByPlugCategoryHash(toSave.plug.plugCategoryHash);
      const category =
        (isModPickerCategory(toSave.plug.plugCategoryHash) && toSave.plug.plugCategoryHash) ||
        (metadata && ModPickerCategories.seasonal) ||
        undefined;

      modsAndPerks.push({ plugDef: toSave, category, season: metadata?.season });
    }
  }

  const getOnClick = (
    plugDef: PluggableInventoryItemDefinition,
    category?: ModPickerCategory,
    season?: number
  ) => {
    if (category) {
      const initialQuery =
        category === ModPickerCategories.seasonal
          ? season?.toString()
          : t(armor2ModPlugCategoriesTitles[category]);
      return () => lbDispatch({ type: 'openModPicker', initialQuery });
    } else {
      return () =>
        lbDispatch({ type: 'openPerkPicker', initialQuery: plugDef.displayProperties.name });
    }
  };

  return (
    <>
      <div className={styles.lockedItems}>
        {modsAndPerks.map(({ plugDef, category, season }, index) => (
          <GeneratedSetMod
            key={index}
            gridColumn={(index % 2) + 1}
            plugDef={plugDef}
            defs={defs}
            onClick={getOnClick(plugDef, category, season)}
          />
        ))}
      </div>
    </>
  );
}

export default GeneratedSetSockets;
