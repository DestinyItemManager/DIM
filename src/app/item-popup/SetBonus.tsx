import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinySandboxPerkDefinition } from 'bungie-api-ts/destiny2';
import styles from './SetBonus.m.scss';

export function SingleItemSetBonus({ item }: { item: DimItem }) {
  const defs = useD2Definitions();
  return (
    defs &&
    item.setBonus && (
      <div className={styles.setBonus}>
        {item.setBonus?.setPerks.map((p) =>
          SetPerk({
            perkDef: defs.SandboxPerk.get(p.sandboxPerkHash),
            setName: item.setBonus!.displayProperties.name,
            pieceCount: p.requiredSetCount,
          }),
        )}
      </div>
    )
  );
  // return item.setBonus && <div>{item.setBonus.displayProperties.name}</div>;
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
