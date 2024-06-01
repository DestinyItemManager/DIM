import type { DimStore, DimTitle } from 'app/inventory/store-types';
import { powerLevelSelector } from 'app/inventory/store/selectors';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import VaultCapacity from 'app/store-stats/VaultCapacity';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import { FontGlyphs } from 'data/d2/d2-font-glyphs';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import styles from './CharacterTile.m.scss';

const gildedIcon = String.fromCodePoint(FontGlyphs.gilded_title);

/**
 * Render a basic character tile without any event handlers
 * This is currently being shared between StoreHeading and CharacterTileButton
 */
export default memo(function CharacterTile({ store }: { store: DimStore }) {
  const isPhonePortrait = useIsPhonePortrait();

  if (store.isVault) {
    return <VaultTile store={store} />;
  }

  return (
    <div
      className={clsx(styles.characterTile, {
        [styles.current]: store.current,
      })}
      style={{
        backgroundImage: `url("${store.background}")`,
        backgroundColor: store.color
          ? `rgb(${Math.round(store.color.red)}, ${Math.round(store.color.green)}, ${Math.round(
              store.color.blue,
            )}`
          : 'black',
      }}
    >
      {store.destinyVersion === 1 && (
        <img className={styles.emblem} src={store.icon} height={40} width={40} />
      )}
      <div className={styles.class}>{store.className}</div>
      <div className={styles.bottom}>
        {store.titleInfo ? <Title titleInfo={store.titleInfo} /> : store.race}
      </div>
      <div className={styles.powerLevel}>
        <AppIcon icon={powerActionIcon} />
        {store.powerLevel}
      </div>
      {isPhonePortrait && <MaxTotalPower store={store} />}
    </div>
  );
});

function VaultTile({ store }: { store: DimStore }) {
  const isPhonePortrait = useIsPhonePortrait();

  return (
    <div className={styles.vaultTile}>
      <img className={styles.vaultEmblem} src={store.icon} height={40} width={40} alt="" />
      <div className={styles.vaultName}>{store.className}</div>
      {isPhonePortrait && (
        <div className={styles.vaultCapacity}>
          <VaultCapacity />
        </div>
      )}
    </div>
  );
}

function MaxTotalPower({ store }: { store: DimStore }) {
  const maxTotalPower = useSelector(
    (state: RootState) => powerLevelSelector(state, store.id)?.maxTotalPower,
  );
  const floorTotalPower = Math.floor(maxTotalPower || store.powerLevel);
  return <div className={styles.maxTotalPower}>/ {floorTotalPower}</div>;
}

/** An equipped Title, earned from completing a Seal */
function Title({ titleInfo }: { titleInfo: DimTitle }) {
  const { title, gildedNum, isGildedForCurrentSeason } = titleInfo;
  return (
    <span
      className={clsx(styles.title, { [styles.gildedCurrentSeason]: isGildedForCurrentSeason })}
    >
      <span>{title}</span>
      {gildedNum > 0 && (
        <>
          <span className={styles.gildedIcon}>{gildedIcon}</span>
          {gildedNum > 1 && <span className={styles.gildedNum}>{gildedNum}</span>}
        </>
      )}
    </span>
  );
}
