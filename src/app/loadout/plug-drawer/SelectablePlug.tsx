import ClosableContainer from 'app/dim-ui/ClosableContainer';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { useD2Definitions } from 'app/manifest/selectors';
import clsx from 'clsx';
import _ from 'lodash';
import React, { useCallback } from 'react';
import styles from './SelectablePlug.m.scss';

export default function SelectablePlug({
  plug,
  selected,
  selectable,
  onPlugSelected,
  onPlugRemoved,
}: {
  plug: PluggableInventoryItemDefinition;
  selected: boolean;
  selectable: boolean;
  onPlugSelected(plug: PluggableInventoryItemDefinition): void;
  onPlugRemoved(plug: PluggableInventoryItemDefinition): void;
}) {
  const defs = useD2Definitions()!;

  const handleClick = useCallback(() => {
    selectable && onPlugSelected(plug);
  }, [onPlugSelected, plug, selectable]);

  const onClose = useCallback(() => onPlugRemoved(plug), [onPlugRemoved, plug]);

  return (
    <ClosableContainer onClose={selected ? onClose : undefined}>
      <div
        className={clsx(styles.plug, {
          [styles.lockedPerk]: selected,
          [styles.unselectable]: !selectable,
        })}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <div className={clsx('item', styles.iconContainer)} title={plug.displayProperties.name}>
          <DefItemIcon itemDef={plug} />
        </div>
        <div className={styles.plugInfo}>
          <div className={styles.plugTitle}>{plug.displayProperties.name}</div>
          {plug.displayProperties.description ? (
            <div>
              <RichDestinyText text={plug.displayProperties.description} />
            </div>
          ) : (
            _.uniqBy(
              plug.perks,
              (p) => defs.SandboxPerk.get(p.perkHash).displayProperties.description
            ).map((perk) => (
              <div key={perk.perkHash}>
                <RichDestinyText
                  text={defs.SandboxPerk.get(perk.perkHash).displayProperties.description}
                />
                {perk.requirementDisplayString && (
                  <div className={styles.requirement}>{perk.requirementDisplayString}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </ClosableContainer>
  );
}
