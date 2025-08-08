import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import {
  DestinyEquipableItemSetDefinition,
  DestinySandboxPerkDefinition,
} from 'bungie-api-ts/destiny2';
import styles from './SetBonus.m.scss';

/**
 * Display the perks that could be granted by an armor set.
 */
export function SetBonus({
  setBonus,
  setCount = 5, // Default to showing all perks
}: {
  setBonus: DestinyEquipableItemSetDefinition;
  /** Only show perks that would be active with this many pieces */
  setCount?: number;
}) {
  const defs = useD2Definitions()!;
  return (
    setCount > 0 && (
      <div className={styles.setBonus}>
        {setBonus.setPerks
          .filter((perk) => perk && setCount >= perk.requiredSetCount)
          .map((p) => (
            <SetPerk
              key={p.sandboxPerkHash}
              perkDef={defs.SandboxPerk.get(p.sandboxPerkHash)}
              setName={setBonus.displayProperties.name}
              requiredSetCount={p.requiredSetCount}
            />
          ))}
      </div>
    )
  );
}

/** A single perk from an armor perk set */
function SetPerk({
  perkDef,
  setName,
  requiredSetCount,
}: {
  perkDef: DestinySandboxPerkDefinition;
  setName: string;
  requiredSetCount: number;
}) {
  const tooltip = (
    <>
      <Tooltip.Header text={perkDef.displayProperties.name} />
      <Tooltip.Subheader
        text={`${setName} | ${t('Item.SetBonus.NPiece', { count: requiredSetCount })}`}
      />
      {perkDef.displayProperties.description}
    </>
  );
  return (
    <PressTip tooltip={tooltip} placement="top" className={styles.perk}>
      <SetPerkIcon perkDef={perkDef} />
      <span>{perkDef.displayProperties.name}</span>
    </PressTip>
  );
}

/** Just the icon for a particular set perk */
export function SetPerkIcon({ perkDef }: { perkDef: DestinySandboxPerkDefinition }) {
  return <BungieImage src={perkDef.displayProperties.icon} className={styles.perkIcon} />;
}
