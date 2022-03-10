import BungieImage from 'app/dim-ui/BungieImage';
import { craftingMaterialCountsSelector, materialsSelector } from 'app/inventory/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { BucketHashes } from 'data/d2/generated-enums';
import spiderMats from 'data/d2/spider-mats.json';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './MaterialCounts.m.scss';

const retiredMats = [31293053, 49145143, 1305274547, 2014411539];
const showMats = spiderMats.filter((m) => !retiredMats.includes(m));
const goodMats = [2979281381, 4257549984, 3853748946, 4257549985, 3702027555];
const seasonal = [747321467, 178490507];
const crafting = [2497395625, 353704689, 2708128607];

export function MaterialCounts() {
  const allMats = useSelector(materialsSelector);
  const craftingMaterialCounts = useSelector(craftingMaterialCountsSelector);
  const defs = useD2Definitions()!;
  const materials = _.groupBy(allMats, (m) => m.hash);
  const consumablesLabel = defs.InventoryBucket[BucketHashes.Consumables].displayProperties.name;

  return (
    <>
      {consumablesLabel}
      <hr />
      <div className={styles.materialCounts}>
        {[showMats, seasonal, goodMats, crafting].map((matgroup, i) => (
          <React.Fragment key={matgroup[0]}>
            {i > 0 && (
              <span className={styles.spanGrid}>
                <hr />
              </span>
            )}
            {/* tack on a special section when we hit the crafting mats group */}
            {matgroup.includes(353704689) && (
              <>
                {craftingMaterialCounts.map(([name, icon, count, max]) => (
                  <React.Fragment key={name}>
                    <span className={styles.matName}>{name}</span>
                    <BungieImage src={icon} />
                    <span className={styles.amount}>{count.toLocaleString()}</span>
                    <span className={styles.capacity}>/ {max.toLocaleString()}</span>
                  </React.Fragment>
                ))}
              </>
            )}
            {matgroup.map((h) => {
              const items = materials[h];
              if (!items) {
                return null;
              }
              const amount = items.reduce((total, i) => total + i.amount, 0);
              const item = items[0];
              const materialName = item.name;
              const max = item.uniqueStack ? item.maxStackSize : false;
              const icon = item.icon;

              if (amount === undefined) {
                return null;
              }

              return (
                <React.Fragment key={h}>
                  <span className={styles.matName}>{materialName}</span>
                  <BungieImage src={icon} />
                  <span className={styles.amount}>{amount.toLocaleString()}</span>
                  <span className={styles.capacity}>/ {max || '∞'}</span>
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
