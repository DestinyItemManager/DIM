import { PluggableInventoryItemDefinition } from 'app/inventory-stores/item-types';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import styles from './Mod.m.scss';
import PlugDef from './PlugDef';

interface Props {
  plugDef: PluggableInventoryItemDefinition;
  gridColumn?: number;
  large?: boolean;
  onClick?(): void;
}

function Mod({ plugDef, gridColumn, large, onClick }: Props) {
  return (
    <div
      role="button"
      className={clsx('item', {
        [styles.perk]: plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics,
        [styles.clickable]: Boolean(onClick),
        [styles.largeItem]: large,
      })}
      style={gridColumn ? { gridColumn } : undefined}
      title={`${plugDef.displayProperties.name}\n${plugDef.itemTypeDisplayName}`}
      tabIndex={0}
      onClick={onClick}
    >
      <PlugDef plug={plugDef} />
    </div>
  );
}

export default Mod;
