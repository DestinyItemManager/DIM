import ClassIcon from 'app/dim-ui/ClassIcon';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import LockedModIcon from 'app/loadout/loadout-ui/LockedModIcon';
import { getModRenderKey } from 'app/loadout/mod-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { compareBy } from 'app/utils/comparators';
import React from 'react';
import styles from './SavedSubclass.m.scss';

// Substrings of item.plug.plugCategoryIdentifier
const PLUG_SORT_ORDER = ['class_abilities', 'movement', 'melee', 'grenades', 'totems', 'trinkets'];

export default function SavedSubclass({
  bucket,
  subclass,
  plugs,
  equip,
  remove,
  onPlugClicked,
}: {
  bucket: InventoryBucket | undefined;
  subclass: DimItem;
  plugs: PluggableInventoryItemDefinition[];
  equip(item: DimItem, e: React.MouseEvent): void;
  remove(item: DimItem, e: React.MouseEvent): void;
  onPlugClicked(plug: PluggableInventoryItemDefinition): void;
}) {
  const defs = useD2Definitions();
  const subclassDef = subclass && defs?.InventoryItem.get(subclass.hash);

  if (!subclass || !bucket || !subclassDef) {
    return null;
  }

  //todo do abilities, fragments and aspects
  const plugKeys = {};
  return (
    <div>
      <div className={styles.title}>{bucket.name}</div>
      <div className={styles.subclassAndPlugs}>
        <div onClick={(e) => equip(subclass, e)} className={styles.subclass}>
          <ClosableContainer
            showCloseIconOnHover={true}
            onClose={(e) => {
              e.stopPropagation();
              remove(subclass, e);
            }}
          >
            <ConnectedInventoryItem item={subclass} ignoreSelectedPerks={true} />
            {subclass.type === 'Class' && (
              <ClassIcon classType={subclass.classType} className="loadout-item-class-icon" />
            )}
          </ClosableContainer>
        </div>
        <div className={styles.plugs}>
          {plugs.sort(compareBy(sortPlugs)).map((plug) => (
            <LockedModIcon
              key={getModRenderKey(plug, plugKeys)}
              mod={plug}
              onClosed={() => onPlugClicked(plug)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * This uses common substrings in the plugCategoryIdentifier to sort the plugs so
 * they appear in a order the user possibly expects.
 */
function sortPlugs(plugDef: PluggableInventoryItemDefinition) {
  const identifier = plugDef.plug.plugCategoryIdentifier;
  const position = PLUG_SORT_ORDER.findIndex((sub) => identifier.includes(sub));
  return position !== -1 ? position : PLUG_SORT_ORDER.length;
}
