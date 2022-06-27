import type { DimStore, DimTitle } from 'app/inventory/store-types';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import VaultCapacity from 'app/store-stats/VaultCapacity';
import clsx from 'clsx';
import { FontGlyphs } from 'data/d2/d2-font-glyphs';
import { memo } from 'react';
import styles from './CharacterTile.m.scss';

function CharacterEmblem({ store }: { store: DimStore }) {
  return <div className={styles.emblem} style={{ backgroundImage: `url("${store.icon}")` }} />;
}

/**
 * Render a basic character tile without any event handlers
 * This is currently being shared between StoreHeading and CharacterTileButton
 */
export default memo(function CharacterTile({ store }: { store: DimStore }) {
  const maxTotalPower = Math.floor(store.stats?.maxTotalPower?.value || store.powerLevel);
  const isPhonePortrait = useIsPhonePortrait();

  return (
    <div className={styles.characterTile}>
      <div
        className={styles.background}
        style={{
          backgroundImage: `url("${store.background}")`,
          backgroundColor: store.color
            ? `rgb(${Math.round(store.color.red)}, ${Math.round(store.color.green)}, ${Math.round(
                store.color.blue
              )}`
            : 'black',
        }}
      />
      <CharacterEmblem store={store} />
      <div className={styles.characterText}>
        <div className={styles.top}>
          <div className={styles.class}>{store.className}</div>
          {!store.isVault && (
            <>
              <div className={styles.powerLevel}>
                <AppIcon icon={powerActionIcon} />
                {store.powerLevel}
              </div>
              {isPhonePortrait && <div className={styles.maxTotalPower}>/ {maxTotalPower}</div>}
            </>
          )}
        </div>
        <div className={styles.bottom}>
          {store.isVault ? (
            isPhonePortrait && <VaultCapacity />
          ) : (
            <>
              <div>{store.titleInfo ? <Title titleInfo={store.titleInfo} /> : store.race}</div>
              {store.destinyVersion === 1 && store.level < 40 && (
                <div className={styles.level}>{store.level}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

function Title({ titleInfo }: { titleInfo: DimTitle }) {
  const { title, gildedNum } = titleInfo;
  const gilded = gildedNum > 0;
  return (
    <span className={clsx(styles.title, { [styles.gilded]: gilded })}>
      {title}
      {gilded && (
        <>
          <span className={styles.gildedIcon}>{String.fromCodePoint(FontGlyphs.gilded_title)}</span>
          {gildedNum > 1 && <span className={styles.gildedNum}>{gildedNum}</span>}
        </>
      )}
    </span>
  );
}
