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
import { LookupTable } from 'app/utils/util-types';
import {
  DestinyEquipableItemSetDefinition,
  DestinySandboxPerkDefinition,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import styles from './SetBonus.m.scss';

/** Information about set bonuses currently/hypothetically provided by  a collection of armor pieces. */
interface ActiveSetBonusInfo {
  // Returned as a convenience for downstream display, to avoid repeat filtering and sorting armor.
  equippedArmor: DimItem[];
  possibleBonusSets: Record<number, DimItem[]>;
  activeSetBonuses: LookupTable<
    number,
    {
      setBonus: DestinyEquipableItemSetDefinition;
      activePerks: Record<
        number,
        {
          def: DestinySandboxPerkDefinition;
          requirement: number;
        }
      >;
    }
  >;
}

/** Given some equipped items, returns info about what set bonuses are active */
export function getSetBonusStatus(
  defs: D2ManifestDefinitions,
  items: DimItem[],
): ActiveSetBonusInfo {
  // You could provide incorrect or unrealistic information to this function, like 10 helmets,
  // but we can at least filter down to armor so this can accept a store's equipped items.
  const equippedArmor = items
    .filter((i) => i.bucket.inArmor)
    .sort(compareByIndex(D2Categories.Armor, (i) => i.bucket.hash));
  const possibleBonusSets: Record<number, DimItem[]> = {};
  const activeSetBonuses: NodeJS.Dict<{
    setBonus: DestinyEquipableItemSetDefinition;
    activePerks: Record<number, { def: DestinySandboxPerkDefinition; requirement: number }>;
  }> = {};

  for (const item of equippedArmor) {
    if (item.setBonus) {
      (possibleBonusSets[item.setBonus.hash] ??= []).push(item);
    }
  }

  for (const h in possibleBonusSets) {
    const possibleSet = possibleBonusSets[h];
    const possibleBonus = possibleSet[0].setBonus!;
    for (const perk of possibleBonus.setPerks) {
      if (possibleSet.length >= perk.requiredSetCount) {
        activeSetBonuses[possibleBonus.hash] ??= {
          setBonus: possibleBonus,
          activePerks: {},
        };
        activeSetBonuses[possibleBonus.hash]!.activePerks[perk.sandboxPerkHash] = {
          def: defs.SandboxPerk.get(perk.sandboxPerkHash),
          requirement: perk.requiredSetCount,
        };
      }
    }
  }
  return {
    equippedArmor,
    possibleBonusSets,
    activeSetBonuses,
  };
}

/** Active set bonuses granted by some equipped or hypothetically equipped armor. */
export function SetBonusesStatus({
  setBonusStatus,
  store,
}: {
  setBonusStatus: ActiveSetBonusInfo;
  store?: DimStore;
}) {
  return (
    <div>
      {Object.values(setBonusStatus.activeSetBonuses).map((sb) => (
        <PressTip
          key={sb!.setBonus.hash}
          tooltip={
            <>
              <Tooltip.Header text={sb!.setBonus.displayProperties.name} />
              {Object.values(sb!.activePerks).map((p) => (
                <React.Fragment key={p.def.hash}>
                  <strong>{`${t('Item.SetBonus.NPiece', { count: p.requirement })} | ${p.def.displayProperties.name}`}</strong>
                  <br />
                  {p.def.displayProperties.description}
                  <hr />
                </React.Fragment>
              ))}
              {store && <ContributingArmor store={store} setBonus={sb!.setBonus} />}
            </>
          }
          placement="top"
        >
          {Object.values(sb!.activePerks).map((p) => (
            <SetPerkIcon key={p.def.hash} perkDef={p.def} active={true} />
          ))}
        </PressTip>
      ))}
    </div>
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
  const satisfying = setBonus.setItems;

  return (
    defs && (
      <div className={styles.gearList}>
        {setBonusStatus.equippedArmor.map((i) => (
          <BungieImage
            key={i.hash}
            src={i.icon}
            className={clsx(styles.gearListIcon, satisfying.includes(i.hash) || styles.unsatisfied)}
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
          .map((p) => (
            <SetPerk
              key={p.sandboxPerkHash}
              store={store}
              perkDef={defs.SandboxPerk.get(p.sandboxPerkHash)}
              setBonus={setBonus}
              requiredSetCount={p.requiredSetCount}
              active={Boolean(
                setBonusStatus.activeSetBonuses[setBonus.hash]?.activePerks[p.sandboxPerkHash],
              )}
            />
          ))}
      </div>
    )
  );
}
