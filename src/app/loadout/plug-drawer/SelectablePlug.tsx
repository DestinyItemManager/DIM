import ClosableContainer from 'app/dim-ui/ClosableContainer';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { StatValue } from 'app/item-popup/PlugTooltip';
import { getPlugDefStats, usePlugDescriptions } from 'app/utils/plug-descriptions';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import styles from './SelectablePlug.m.scss';

/**
 * A single selectable plug in the PlugDrawer component. This shows the details of the plug along
 * with whether it's selected and whether it *can* be selected.
 */
export default function SelectablePlug({
  plug,
  classType,
  selected,
  selectable,
  selectionType,
  removable,
  onPlugSelected,
  onPlugRemoved,
}: {
  plug: PluggableInventoryItemDefinition;
  classType: DestinyClass;
  selected: boolean;
  selectable: boolean;
  selectionType: 'multi' | 'single';
  removable: boolean;
  onPlugSelected: (plug: PluggableInventoryItemDefinition) => void;
  onPlugRemoved: (plug: PluggableInventoryItemDefinition) => void;
}) {
  const handleClick = useCallback(() => {
    selectable && onPlugSelected(plug);
  }, [onPlugSelected, plug, selectable]);

  const onClose = useCallback(() => onPlugRemoved(plug), [onPlugRemoved, plug]);

  // Memoize the meat of the component as it doesn't need to re-render every time
  const plugDetails = useMemo(
    () => <SelectablePlugDetails plug={plug} classType={classType} />,
    [plug, classType]
  );

  return (
    <ClosableContainer onClose={selected && removable ? onClose : undefined}>
      <div
        className={clsx(styles.plug, {
          [styles.lockedPerk]: selected,
          [styles.unselectable]: selectionType === 'multi' && !selectable,
        })}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        {plugDetails}
      </div>
    </ClosableContainer>
  );
}

function SelectablePlugDetails({
  plug,
  classType,
}: {
  plug: PluggableInventoryItemDefinition;
  classType: DestinyClass;
}) {
  const stats = getPlugDefStats(plug, classType);

  // We don't show Clarity descriptions here due to layout concerns, see #9318 / #8641
  const plugDescriptions = usePlugDescriptions(plug, stats, /* forceUseBungieDescriptions */ true);
  return (
    <>
      <div className="item" title={plug.displayProperties.name}>
        <DefItemIcon itemDef={plug} />
      </div>
      <div className={styles.plugInfo}>
        <div className={styles.plugTitle}>{plug.displayProperties.name}</div>
        {plugDescriptions.perks.map((perkDesc) => (
          <div className={styles.partialDescription} key={perkDesc.perkHash}>
            {perkDesc.description && <RichDestinyText text={perkDesc.description} />}
            {perkDesc.requirement && (
              <div className={styles.requirement}>{perkDesc.requirement}</div>
            )}
          </div>
        ))}
        {stats.length > 0 && (
          <div className="plug-stats">
            {stats.map((stat) => (
              <StatValue key={stat.statHash} statHash={stat.statHash} value={stat.value} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
