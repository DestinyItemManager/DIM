import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { useCurrentSetBonus } from 'app/inventory/store/hooks';
import { useD2Definitions } from 'app/manifest/selectors';
import { filterMap } from 'app/utils/collections';
import { compareByIndex } from 'app/utils/comparators';
import {
  DestinyEquipableItemSetDefinition,
  DestinySandboxPerkDefinition,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import styles from './SetBonus.m.scss';

/**
 * Display the perks that could be granted by an armor set.
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

/** A single perk from an armor perk set */
export function SetPerk({
  perkDef,
  setBonus,
  requiredSetCount,
  store,
  active,
  noLabel,
  showEquipped,
}: {
  perkDef: DestinySandboxPerkDefinition;
  setBonus: DestinyEquipableItemSetDefinition;
  requiredSetCount: number;
  active: boolean;
  store?: DimStore;
  noLabel?: boolean;
  showEquipped?: boolean;
}) {
  const tooltip = (
    <>
      <Tooltip.Header text={perkDef.displayProperties.name} />
      <Tooltip.Subheader
        text={`${setBonus.displayProperties.name} | ${t('Item.SetBonus.NPiece', { count: requiredSetCount })}`}
      />
      {perkDef.displayProperties.description}
      {store && <ContributingArmor store={store} setBonus={setBonus} showEquipped={showEquipped} />}
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

/** Just the icon for a particular set perk */
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

export function ContributingArmor({
  setBonus,
  store,
  showEquipped,
}: {
  setBonus: DestinyEquipableItemSetDefinition;
  store: DimStore;
  /** Show the item's owner's armor (instead of the hypothetical armor set) */
  showEquipped?: boolean;
}) {
  const defs = useD2Definitions()!;
  const setBonusStatus = useCurrentSetBonus(store.id);
  const equippedHashes = setBonusStatus.equippedArmor.map((i) => i.hash);
  const satisfying = showEquipped ? setBonus.setItems : equippedHashes;
  const shown = filterMap(showEquipped ? equippedHashes : setBonus.setItems, (h) => {
    const def = defs.InventoryItem.get(h);
    if (showEquipped || store.classType === def.classType) {
      return def;
    }
  }).sort(compareByIndex(D2Categories.Armor, (i) => i.inventory?.bucketTypeHash));

  return (
    defs && (
      <div className={styles.gearList}>
        {shown.map((i) => (
          <BungieImage
            key={i.hash}
            src={i.displayProperties.icon}
            className={clsx(styles.gearListIcon, satisfying.includes(i.hash) || styles.unsatisfied)}
          />
        ))}
      </div>
    )
  );
}
