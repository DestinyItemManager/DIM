import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { useCurrentSetBonus } from 'app/inventory/store/hooks';
import { useD2Definitions } from 'app/manifest/selectors';
import { compareByIndex } from 'app/utils/comparators';
import {
  DestinyEquipableItemSetDefinition,
  DestinySandboxPerkDefinition,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
// eslint-disable-next-line css-modules/no-unused-class
import * as pressTipStyles from '../dim-ui/PressTip.m.scss';
import * as styles from './SetBonus.m.scss';

/** Given some equipped items, returns info about what set bonuses are active */
export function getSetBonusStatus(defs: D2ManifestDefinitions, items: DimItem[]) {
  // You could provide incorrect or unrealistic information to this function, like 10 helmets,
  // but we can at least filter down to armor so this can accept a store's equipped items.
  const equippedArmor = items
    .filter((i) => i.bucket.inArmor)
    .sort(compareByIndex(D2Categories.Armor, (i) => i.bucket.hash));
  const possibleBonusSets: Record<number, DimItem[]> = {};

  // It's easier to build a boolean here than play "is the object empty" downstream.
  const activeSetBonuses = new Set<DestinyEquipableItemSetDefinition>();
  const activePerks = new Set<number>();
  const perkDefs: Record<number, DestinySandboxPerkDefinition> = {};

  // Collect perk defs/display info here, instead of repeatedly
  // looking it up in JSX consumers of this output.
  const displayIterable = [];

  for (const item of equippedArmor) {
    if (item.setBonus) {
      (possibleBonusSets[item.setBonus.hash] ??= []).push(item);
    }
  }

  for (const h in possibleBonusSets) {
    const matchingSetItems = possibleBonusSets[h];
    const possibleBonus = matchingSetItems[0].setBonus!;
    const info: {
      bonusDef: DestinyEquipableItemSetDefinition;
      activePerks: { requiredSetCount: number; perkDef: DestinySandboxPerkDefinition }[];
    } = { bonusDef: possibleBonus, activePerks: [] };

    for (const { sandboxPerkHash, requiredSetCount } of possibleBonus.setPerks) {
      const perkDef = defs.SandboxPerk.get(sandboxPerkHash);
      perkDefs[sandboxPerkHash] = perkDef;
      if (matchingSetItems.length >= requiredSetCount) {
        activePerks.add(sandboxPerkHash);
        activeSetBonuses.add(possibleBonus);
        info.activePerks.push({ requiredSetCount, perkDef });
      }
    }
    if (info.activePerks.length) {
      displayIterable.push(info);
    }
  }

  return {
    displayIterable,
    activeSetBonuses,
    activePerks,
    equippedArmor,
    perkDefs,
  };
}

/** Information about set bonuses currently/hypothetically provided by  a collection of armor pieces. */
export type ActiveSetBonusInfo = ReturnType<typeof getSetBonusStatus>;

/**
 * Active set bonuses granted by some equipped or hypothetically equipped armor,
 * displayed as 0, 1, or 2 perk circles with a tooltip.
 */
export function SetBonusesStatus({
  setBonusStatus: { displayIterable },
  store,
}: {
  setBonusStatus: ActiveSetBonusInfo;
  store?: DimStore;
}) {
  return (
    <PressTip
      className={styles.setBonusesStatus}
      tooltip={
        <>
          {displayIterable.map(({ bonusDef, activePerks }) => (
            <React.Fragment key={bonusDef.hash}>
              <div className={pressTipStyles.header}>
                <h2>{bonusDef.displayProperties.name}</h2>
              </div>
              {activePerks.map(({ requiredSetCount, perkDef }, i) => {
                const { displayProperties, hash } = perkDef;
                return (
                  <React.Fragment key={hash}>
                    <div className={pressTipStyles.header}>
                      <h3 className={styles.perkNameSubheader}>
                        <SetPerkIcon perkDef={perkDef} active />
                        {`${t('Item.SetBonus.NPiece', { count: requiredSetCount })} | ${displayProperties.name}`}
                      </h3>
                    </div>
                    <div className={pressTipStyles.content}>
                      {displayProperties.description}
                      {i === activePerks.length - 1 && store && (
                        <ContributingArmor store={store} setBonus={bonusDef} />
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </>
      }
      placement="top"
    >
      {displayIterable.flatMap((b) =>
        b.activePerks.map(({ perkDef }) => (
          <SetPerkIcon key={perkDef.hash} perkDef={perkDef} active={true} />
        )),
      )}
    </PressTip>
  );
}

/** A single perk display from an armor set bonus */
export function SetPerk({
  perkDef,
  setBonus,
  requiredSetCount,
  store,
  active,
  noLabel,
}: {
  perkDef: DestinySandboxPerkDefinition;
  setBonus: DestinyEquipableItemSetDefinition;
  requiredSetCount: number;
  active: boolean;
  store?: DimStore;
  noLabel?: boolean;
}) {
  const tooltip = (
    <>
      <Tooltip.Header text={perkDef.displayProperties.name} />
      <Tooltip.Subheader
        text={`${setBonus.displayProperties.name} | ${t('Item.SetBonus.NPiece', { count: requiredSetCount })}`}
      />
      {perkDef.displayProperties.description}
      {store && <ContributingArmor store={store} setBonus={setBonus} />}
    </>
  );
  return (
    <PressTip
      tooltip={tooltip}
      placement="top"
      className={clsx(styles.perk, noLabel && styles.justCircle)}
    >
      <SetPerkIcon active={active} perkDef={perkDef} />
      {!noLabel && <span>{perkDef.displayProperties.name}</span>}
    </PressTip>
  );
}

/** Just the icon for a particular set bonus perk */
export function SetPerkIcon({
  perkDef,
  active,
}: {
  perkDef: DestinySandboxPerkDefinition;
  active?: boolean;
}) {
  return (
    <BungieImage
      src={perkDef.displayProperties.icon}
      className={clsx(styles.perkIcon, active && styles.activePerk)}
    />
  );
}

/**
 * Specifically when a store is involved, we can display a little list of its 5 armor pieces,
 * and highlight which are contributing a specific active set bonus.
 */
function ContributingArmor({
  setBonus,
  store,
}: {
  setBonus: DestinyEquipableItemSetDefinition;
  store: DimStore;
}) {
  const defs = useD2Definitions()!;
  const setBonusStatus = useCurrentSetBonus(store.id);

  return (
    defs && (
      <div className={styles.gearList}>
        {setBonusStatus.equippedArmor.map((i) => (
          <BungieImage
            key={i.hash}
            src={i.icon}
            className={clsx(
              styles.gearListIcon,
              setBonus.setItems.includes(i.hash) || styles.unsatisfied,
            )}
          />
        ))}
      </div>
    )
  );
}

/**
 * Given a set bonus definition, show what its perks are.
 * Highlight a perk if a store is provided and that store has the perk active.
 */
export function SetBonus({
  setBonus,
  setCount = 5, // Default to showing all perks
  store,
}: {
  setBonus: DestinyEquipableItemSetDefinition;
  /** Only show perks that would be active with this many pieces */
  setCount?: number;
  store?: DimStore;
}) {
  const defs = useD2Definitions()!;
  const setBonusStatus = useCurrentSetBonus(store?.id ?? 'vault');

  return (
    setCount > 0 && (
      <div className={styles.setBonus}>
        {setBonus.setPerks
          .filter((perk) => perk && setCount >= perk.requiredSetCount)
          .map(({ sandboxPerkHash, requiredSetCount }) => (
            <SetPerk
              key={sandboxPerkHash}
              store={store}
              perkDef={defs.SandboxPerk.get(sandboxPerkHash)}
              setBonus={setBonus}
              requiredSetCount={requiredSetCount}
              active={setBonusStatus.activePerks.has(sandboxPerkHash)}
            />
          ))}
      </div>
    )
  );
}
