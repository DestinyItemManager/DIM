import BungieImage from 'app/dim-ui/BungieImage';
import { craftingMaterialCountsSelector, materialsSelector } from 'app/inventory/selectors';
import clsx from 'clsx';
import spiderMats from 'data/d2/spider-mats.json';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './MaterialCounts.m.scss';

const retiredMats = [31293053, 49145143, 1305274547, 2014411539];
const showMats = spiderMats.filter((m) => !retiredMats.includes(m));
const goodMats = [2979281381, 4257549984, 3853748946, 4257549985, 3702027555];
const seasonal = [747321467, 178490507, 2206486079, 2181364647];
const crafting = [2497395625, 353704689, 2708128607];

export function MaterialCounts({ wide }: { wide?: boolean }) {
  const allMats = useSelector(materialsSelector);
  const craftingMaterialCounts = useSelector(craftingMaterialCountsSelector);
  const materials = _.groupBy(allMats, (m) => m.hash);

  return (
    <div className={clsx(styles.materialCounts, { [styles.wide]: wide })}>
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
              {craftingMaterialCounts.map(([name, icon, count]) => (
                <React.Fragment key={name}>
                  <span className={styles.amount}>{count.toLocaleString()}</span>
                  <BungieImage src={icon} />
                  <span>{name}</span>
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
            const icon = item.icon;

            if (amount === undefined) {
              return null;
            }

            return (
              <div className={styles.material} key={h}>
                <span className={styles.amount}>{amount.toLocaleString()}</span>
                <BungieImage src={icon} />
                <span>{materialName}</span>
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
