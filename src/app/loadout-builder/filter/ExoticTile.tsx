import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { TileGridTile } from 'app/dim-ui/TileGrid';
import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import React from 'react';
import * as styles from './ExoticTile.m.scss';

export interface LockedExoticWithPlugs {
  def: DestinyInventoryItemDefinition;
  /** The intrinsic perk that is unique to this exotic. */
  exoticPerk?: PluggableInventoryItemDefinition;
  /** If the exotic has unique exotic mods (e.g. aeon soul) this will be populated with those mods. */
  exoticMods?: PluggableInventoryItemDefinition[];
  isArmor1: boolean;
}

/**
 * A tile containing the exotic name, icon, and perk/mods info.
 *
 * When rendering perks a short description will be pulled from the SandboxPerk definition.
 * Mods on the other hand only get a name and icon as multiple descriptions takes up too
 * much room on screen.
 */
export default function ExoticTile({
  exotic,
  selected,
  onSelected,
}: {
  exotic: LockedExoticWithPlugs;
  selected: boolean;
  onSelected: () => void;
}) {
  const defs = useD2Definitions()!;
  const { title, icon, description } = exoticTileInfo(defs, exotic);
  return (
    <TileGridTile
      selected={selected}
      onClick={onSelected}
      disabled={exotic.isArmor1}
      title={title}
      icon={icon}
      compact
    >
      {description}
    </TileGridTile>
  );
}

export function exoticTileInfo(defs: D2ManifestDefinitions, exotic: LockedExoticWithPlugs) {
  const { def, exoticPerk, exoticMods } = exotic;
  let perkShortDescription = exoticPerk?.displayProperties.description;

  if (exoticPerk) {
    for (const perk of exoticPerk.perks) {
      const description = defs.SandboxPerk.get(perk.perkHash)?.displayProperties.description;
      if (description) {
        perkShortDescription = description;
        break;
      }
    }
  }

  const description = (
    <>
      {exotic.isArmor1 && <div>{t('LB.IncompatibleWithOptimizer')}</div>}
      {exoticPerk && perkShortDescription}
      {exoticMods?.map((mod) => (
        <div key={mod.hash} className={styles.perkOrModNameAndImage}>
          <DefItemIcon className={styles.perkOrModImage} itemDef={mod} />
          <div>{mod.displayProperties.name}</div>
        </div>
      ))}
    </>
  );
  const title = def.displayProperties.name;
  const icon = (
    <div className="item">
      <DefItemIcon itemDef={def} />
    </div>
  );

  return { icon, title, description } as const;
}

/**
 * A fake version of the exotic tile that isn't associated with a real item
 * definition, used for things like "no exotic".
 */
export function FakeExoticTile({
  title,
  description,
  icon,
  selected,
  onSelected,
}: {
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onSelected: React.MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <TileGridTile
      selected={selected}
      onClick={onSelected}
      title={title}
      icon={
        <div className="item">
          <img src={icon} className="item-img" />
        </div>
      }
    >
      {description}
    </TileGridTile>
  );
}
