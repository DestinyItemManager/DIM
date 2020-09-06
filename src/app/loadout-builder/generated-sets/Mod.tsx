import { getModCostInfo } from 'app/collections/Mod';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage, { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import styles from './Mod.m.scss';

interface Props {
  plugDef: PluggableInventoryItemDefinition;
  defs: D2ManifestDefinitions;
  gridColumn?: number;
  large?: boolean;
  onClick?(): void;
}

function Mod({ plugDef, defs, gridColumn, large, onClick }: Props) {
  const { energyCost, energyCostElementOverlay } = getModCostInfo(plugDef, defs);

  const classes = {
    [styles.item]: true,
    [styles.perk]: plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics,
    [styles.clickable]: Boolean(onClick),
  };

  const largeSize = {
    ['make-item-size']: large,
  };

  return (
    <div
      role="button"
      className={clsx(classes, largeSize)}
      style={gridColumn ? { gridColumn } : undefined}
      title={plugDef.displayProperties.name}
      tabIndex={0}
      onClick={onClick}
    >
      <BungieImage className={clsx('item-img', largeSize)} src={plugDef.displayProperties.icon} />
      {energyCostElementOverlay && (
        <>
          <div
            style={bungieBackgroundStyle(energyCostElementOverlay)}
            className={clsx(styles.energyCostOverlay, largeSize)}
          />
          <div className={clsx(styles.energyCost, largeSize)}>{energyCost}</div>
        </>
      )}
    </div>
  );
}

export default Mod;
