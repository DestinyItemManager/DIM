import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import {
  DestinyEquipableItemSetDefinition,
  DestinySandboxPerkDefinition,
} from 'bungie-api-ts/destiny2';
import styles from './SetBonus.m.scss';

export function SingleItemSetBonus({ item }: { item: DimItem }) {
  const defs = useD2Definitions();
  return (
    defs &&
    item.setBonus &&
    SetBonus({
      setBonus: item.setBonus,
      defs: defs,
    })
  );
}

export function SetBonus({
  setBonus,
  defs,
  setCount = 5, // Default to showing all perks
}: {
  setBonus: DestinyEquipableItemSetDefinition;
  setCount?: number;
  defs: D2ManifestDefinitions;
}) {
  return (
    setCount > 0 && (
      <div className={styles.setBonus}>
        {setBonus.setPerks
          .filter((perk) => perk && setCount >= perk.requiredSetCount)
          .map((p) =>
            SetPerk({
              perkDef: defs.SandboxPerk.get(p.sandboxPerkHash),
              setName: setBonus.displayProperties.name,
              pieceCount: p.requiredSetCount,
            }),
          )}
      </div>
    )
  );
}

export function SetPerk({
  perkDef,
  setName,
  pieceCount,
}: {
  perkDef: DestinySandboxPerkDefinition;
  setName: string;
  pieceCount: number;
}) {
  const tooltip = (
    <>
      <Tooltip.Header text={perkDef.displayProperties.name} />
      <Tooltip.Subheader
        text={`${setName} | ${t('Item.SetBonus.NPiece', { count: pieceCount })}`}
      />
      {perkDef.displayProperties.description}
    </>
  );
  return (
    <PressTip tooltip={tooltip} placement="top" className={styles.perk} key={perkDef.hash}>
      <div className={styles.perkIcon}>
        <BungieImage src={perkDef.displayProperties.icon} />
      </div>
      <span>{perkDef.displayProperties.name}</span>
    </PressTip>
  );
}
