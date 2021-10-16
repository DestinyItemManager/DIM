import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import styles from './Mod.m.scss';

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
      title={plugDef.displayProperties.name}
      tabIndex={0}
      onClick={onClick}
    >
      <DefItemIcon itemDef={plugDef} />
    </div>
  );
}

export default Mod;
