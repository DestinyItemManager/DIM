import BungieImage from 'app/dim-ui/BungieImage';
import {
  allCharactersCombinedCurrenciesSelector,
  craftingMaterialCountsSelector,
  materialsSelector,
} from 'app/inventory/selectors';
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
const seasonal = [747321467];
const crafting = [3491404510, 2497395625, 353704689];
export function MaterialCounts() {
  const allMats = useSelector(materialsSelector);
  const plugBasedCurrencyCounts = useSelector(craftingMaterialCountsSelector);
  // Neutral Element is for some reason tracked per-character but not in profile...
  // to-do: re-check this in a week or two
  const characterCurrencyCounts = useSelector(allCharactersCombinedCurrenciesSelector);

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
                {Object.entries(plugBasedCurrencyCounts).map(([materialHash, amount]) => {
                  const matDef = defs.Objective.get(materialHash as unknown as number);
                  return (
                    <React.Fragment key={materialHash}>
                      <span className={styles.amount}>{amount.toLocaleString()}</span>
                      <BungieImage src={matDef.displayProperties.icon} />
                      <span>{matDef.progressDescription}</span>
                    </React.Fragment>
                  );
                })}
              </>
            )}
            {matgroup.map((h) => {
              let amount: number | undefined;
              let materialName = '';
              let icon = '';
              const items = materials[h];
              if (items) {
                amount = items.reduce((total, i) => total + i.amount, 0);
                const item = items[0];
                materialName = item.name;
                icon = item.icon;
              } else if (h in characterCurrencyCounts) {
                amount = characterCurrencyCounts[h];
                const item = defs.InventoryItem.get(h);
                materialName = item.displayProperties.name;
                icon = item.displayProperties.icon;
              }
              if (amount === undefined) {
                return null;
              }

              return (
                <React.Fragment key={h}>
                  <span className={styles.amount}>{amount.toLocaleString()}</span>
                  <BungieImage src={icon} />
                  <span>{materialName}</span>
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
