import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory-item/ItemIcon';
import { PluggableInventoryItemDefinition } from 'app/inventory-stores/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import styles from './ExoticTile.m.scss';

export interface LockedExoticWithPlugs {
  def: DestinyInventoryItemDefinition;
  /** The intrinsic perk that is unique to this exotic. */
  exoticPerk?: PluggableInventoryItemDefinition;
  /** If the exotic has unique exotic mods (e.g. aeon soul) this will be populated with those mods. */
  exoticMods?: PluggableInventoryItemDefinition[];
  isArmor1: boolean;
}

interface Props {
  exotic: LockedExoticWithPlugs;
  selected: boolean;
  onSelected(): void;
}

/**
 * A square tile container the exotic name, icon, and perk/mods info.
 *
 * When rendering perks a short description will be pulled from the SandboxPerk definition.
 * Mods on the other hand only get a name and icon as multiple descriptions takes up too
 * much room on screen.
 */
function ExoticTileContents({ exotic }: Pick<Props, 'exotic'>) {
  const defs = useD2Definitions()!;
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

  return (
    <>
      <div className={styles.itemName}>{def.displayProperties.name}</div>
      <div className={styles.details}>
        <div className={styles.itemImage}>
          <DefItemIcon itemDef={def} />
        </div>
        {exoticPerk && (
          <div className={styles.perkOrModInfo}>
            <div className={styles.perkOrModNameAndImage}>
              <DefItemIcon className={styles.perkOrModImage} itemDef={exoticPerk} />
              <div className={styles.perkOrModName}>{exoticPerk.displayProperties.name}</div>
            </div>
            <div className={styles.perkDescription}>{perkShortDescription}</div>
          </div>
        )}
        <div className={styles.mods}>
          {exoticMods?.map((mod) => (
            <div key={mod.hash} className={styles.perkOrModInfo}>
              <div className={styles.perkOrModNameAndImage}>
                <DefItemIcon className={styles.perkOrModImage} itemDef={mod} />
                <div className={styles.perkOrModName}>{mod.displayProperties.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ExoticTile({ exotic, selected, onSelected }: Props) {
  return exotic.isArmor1 ? (
    <PressTip
      className={clsx(styles.exotic, styles.disabled)}
      tooltip={<div>{t('LB.IncompatibleWithOptimizer')}</div>}
    >
      <ExoticTileContents exotic={exotic} />
    </PressTip>
  ) : (
    <div className={clsx(styles.exotic, { [styles.selected]: selected })} onClick={onSelected}>
      <ExoticTileContents exotic={exotic} />
    </div>
  );
}

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
    <div className={clsx(styles.exotic, { [styles.selected]: selected })} onClick={onSelected}>
      <div className={styles.itemName}>{title}</div>
      <div className={styles.details}>
        <div className={styles.itemImage}>
          <img src={icon} className="item-img" />
        </div>
        <div className={styles.perkOrModInfo}>
          <div className={styles.perkDescription}>{description}</div>
        </div>
      </div>
    </div>
  );
}

export default ExoticTile;
