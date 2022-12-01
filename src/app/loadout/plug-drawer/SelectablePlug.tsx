import ClosableContainer from 'app/dim-ui/ClosableContainer';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { StatValue } from 'app/item-popup/PlugTooltip';
import { usePlugDescriptions } from 'app/utils/plug-descriptions';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import styles from './SelectablePlug.m.scss';

/**
 * A single selectable plug in the PlugDrawer component. This shows the details of the plug along
 * with whether it's selected and whether it *can* be selected.
 */
export default function SelectablePlug({
  plug,
  selected,
  selectable,
  selectionType,
  removable,
  displayedStatHashes,
  onPlugSelected,
  onPlugRemoved,
}: {
  plug: PluggableInventoryItemDefinition;
  selected: boolean;
  selectable: boolean;
  selectionType: 'multi' | 'single';
  removable: boolean;
  displayedStatHashes?: number[];
  onPlugSelected(plug: PluggableInventoryItemDefinition): void;
  onPlugRemoved(plug: PluggableInventoryItemDefinition): void;
}) {
  const handleClick = useCallback(() => {
    selectable && onPlugSelected(plug);
  }, [onPlugSelected, plug, selectable]);

  const onClose = useCallback(() => onPlugRemoved(plug), [onPlugRemoved, plug]);

  // Memoize the meat of the component as it doesn't need to re-render every time
  const plugDetails = useMemo(
    () => <SelectablePlugDetails plug={plug} displayedStatHashes={displayedStatHashes} />,
    [plug, displayedStatHashes]
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
  displayedStatHashes,
}: {
  plug: PluggableInventoryItemDefinition;
  displayedStatHashes?: number[];
}) {
  const displayedStats = plug.investmentStats.filter((stat) =>
    displayedStatHashes?.includes(stat.statTypeHash)
  );
  const plugDescriptions = usePlugDescriptions(
    plug,
    displayedStats.map((stat) => ({ statHash: stat.statTypeHash, value: stat.value }))
  );
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
        {displayedStats.length > 0 && (
          <div className="plug-stats">
            {displayedStats.map((stat) => (
              <StatValue key={stat.statTypeHash} statHash={stat.statTypeHash} value={stat.value} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
