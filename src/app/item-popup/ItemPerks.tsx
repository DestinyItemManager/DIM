import BungieImage from 'app/dim-ui/BungieImage';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyItemPerkEntryDefinition } from 'bungie-api-ts/destiny2';
import styles from './ItemPerks.m.scss';

export default function ItemPerks({ item }: { item: DimItem }) {
  if (!item.perks) {
    return null;
  }

  return (
    <div className="item-details">
      {item.perks.map((perk) => (
        <ItemPerk key={perk.perkHash} perk={perk} />
      ))}
    </div>
  );
}

function ItemPerk({ perk }: { perk: DestinyItemPerkEntryDefinition }) {
  const defs = useD2Definitions()!;
  const perkDef = defs.SandboxPerk.get(perk.perkHash);
  const { hasIcon, icon, name, description } = perkDef.displayProperties;

  return (
    <div className={styles.itemPerk}>
      {hasIcon && <BungieImage src={icon} />}
      <div>
        <div className={styles.itemPerkName}>{name}</div>
        <RichDestinyText text={description} />
      </div>
    </div>
  );
}
