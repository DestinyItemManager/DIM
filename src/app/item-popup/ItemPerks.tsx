import BungieImage from 'app/dim-ui/BungieImage';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { FISHING_BAIT_PERK } from 'app/search/d2-known-values';
import { DestinyItemPerkEntryDefinition } from 'bungie-api-ts/destiny2';

export default function ItemPerks({ item }: { item: DimItem }) {
  if (!item.perks) {
    return null;
  }

  return (
    <div className="item-details item-perks">
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
    <div className="item-perk">
      {hasIcon && perk.perkHash !== FISHING_BAIT_PERK && <BungieImage src={icon} />}
      <div className="item-perk-info">
        <div className="item-perk-name">{name}</div>
        <RichDestinyText className="item-perk-description" text={description} />
      </div>
    </div>
  );
}
