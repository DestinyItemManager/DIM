import ClarityDescriptions from 'app/clarity/descriptions/ClarityDescriptions';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { TileGridTile } from 'app/dim-ui/TileGrid';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { PlugStats } from 'app/item-popup/PlugTooltip';
import { getPlugDefStats, usePlugDescriptions } from 'app/utils/plug-descriptions';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { useCallback, useMemo } from 'react';
import PlugStackableIcon from './PlugStackableIcon';
import styles from './SelectablePlug.m.scss';
import { PlugSelectionType } from './types';

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
  selectionType: PlugSelectionType;
  removable: boolean;
  onPlugSelected: (plug: PluggableInventoryItemDefinition) => void;
  onPlugRemoved: (plug: PluggableInventoryItemDefinition) => void;
}) {
  const handleClick = useCallback(() => {
    selectable
      ? onPlugSelected(plug)
      : selectionType !== PlugSelectionType.Single && selected && removable && onPlugRemoved(plug);
  }, [onPlugRemoved, onPlugSelected, plug, selectable, selected, selectionType, removable]);

  const onClose = useCallback(() => onPlugRemoved(plug), [onPlugRemoved, plug]);

  // Memoize the meat of the component as it doesn't need to re-render every time
  const plugDetails = useMemo(
    () => <SelectablePlugDetails plug={plug} classType={classType} />,
    [plug, classType],
  );

  return (
    <ClosableContainer
      onClose={
        selectionType !== PlugSelectionType.Unique && selected && removable ? onClose : undefined
      }
    >
      <TileGridTile
        selected={selected}
        disabled={
          !(
            selectable ||
            (selectionType !== PlugSelectionType.Single && selected && removable) ||
            (selectionType === PlugSelectionType.Single && selected)
          )
        }
        title={plug.displayProperties.name}
        icon={
          <>
            <div className="item" title={plug.displayProperties.name}>
              <DefItemIcon itemDef={plug} />
            </div>
            2x
          </>
        }
        onClick={handleClick}
      >
        {plugDetails}
      </TileGridTile>
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
  const plugDescriptions = usePlugDescriptions(plug, stats, /* forceUseBungieDescriptions */ false);

  return (
    <>
      <PlugStackableIcon descriptions={plugDescriptions} hash={plug.hash} />
      {plugDescriptions.perks.map(
        (perkDesc) =>
          perkDesc.description && (
            <RichDestinyText key={perkDesc.perkHash} text={perkDesc.description} />
          ),
      )}
      {plugDescriptions.communityInsight && (
        <ClarityDescriptions
          perk={plugDescriptions.communityInsight}
          className={styles.clarityDescription}
        />
      )}
      {stats.length > 0 && <PlugStats stats={stats} />}
    </>
  );
}
