import BungieImage from 'app/dim-ui/BungieImage';
import { materialsSelector } from 'app/inventory/selectors';
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
const seasonal = [1425776985, 1776857076];

export function MaterialCounts() {
  const allMats = useSelector(materialsSelector);
  const defs = useD2Definitions()!;
  const materials = _.groupBy(allMats, (m) => m.hash);
  const consumablesLabel = defs.InventoryBucket[BucketHashes.Consumables].displayProperties.name;

  return (
    <>
      {consumablesLabel}
      <hr />
      <div className={styles.materialCounts}>
        {[showMats, seasonal, goodMats].map((matgroup, i) => (
          <React.Fragment key={matgroup[0]}>
            {i > 0 && (
              <span className={styles.spanGrid}>
                <hr />
              </span>
            )}
            {matgroup.map((h) => {
              const items = materials[h];
              if (!items) {
                return null;
              }
              const amount = items.reduce((total, i) => total + i.amount, 0);
              const item = items[0];
              return (
                <React.Fragment key={item.hash}>
                  <span className={styles.amount}>{amount.toLocaleString()}</span>
                  <BungieImage src={item.icon} />
                  <span>{item.name}</span>
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
