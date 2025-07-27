import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import { t, tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import styles from './SetBonus.m.scss';

const pieceNumbers = [tl('Item.SetBonus.2Piece'), tl('Item.SetBonus.4Piece')];

export function SingleItemSetBonus({ item }: { item: DimItem }) {
  const defs = useD2Definitions();
  return (
    defs &&
    item.setBonus && (
      <div className={styles.setBonus}>
        {item.setBonus?.setPerks.map((p, i) => {
          const perkDef = defs.SandboxPerk.get(p.sandboxPerkHash);
          const tooltip = (
            <>
              <Tooltip.Header text={perkDef.displayProperties.name} />
              <Tooltip.Subheader
                text={`${item.setBonus!.displayProperties.name} | ${t(pieceNumbers[i])}`}
              />
              {perkDef.displayProperties.description}
            </>
          );
          return (
            <PressTip
              tooltip={tooltip}
              placement="top"
              className={styles.perk}
              key={p.sandboxPerkHash}
            >
              <div className={styles.perkIcon}>
                <BungieImage src={perkDef.displayProperties.icon} />
              </div>
              <span>{perkDef.displayProperties.name}</span>
            </PressTip>
          );
        })}
      </div>
    )
  );
  // return item.setBonus && <div>{item.setBonus.displayProperties.name}</div>;
}
