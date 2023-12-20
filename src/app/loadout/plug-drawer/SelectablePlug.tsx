import ClarityDescriptions from 'app/clarity/descriptions/ClarityDescriptions';
import { TileGridTile } from 'app/dim-ui/TileGrid';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { PlugStats } from 'app/item-popup/PlugTooltip';
import { minusIcon, plusIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
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
  stack,
  removable,
  onPlugSelected,
  onPlugRemoved,
}: {
  plug: PluggableInventoryItemDefinition;
  /** How many of this specific mod have been selected? (only for stackable mods) */
  stack: number;
  classType: DestinyClass;
  selected: boolean;
  selectable: boolean;
  selectionType: PlugSelectionType;
  removable: boolean;
  onPlugSelected: (plug: PluggableInventoryItemDefinition) => void;
  onPlugRemoved: (plug: PluggableInventoryItemDefinition) => void;
}) {
  const canRemoveOnClick =
    selectionType !== PlugSelectionType.Single && selected && removable && stack <= 1;

  const handleClick = useCallback(() => {
    selectable ? onPlugSelected(plug) : canRemoveOnClick && onPlugRemoved(plug);
  }, [selectable, onPlugSelected, plug, canRemoveOnClick, onPlugRemoved]);

  // Memoize the meat of the component as it doesn't need to re-render every time
  const plugDetails = useMemo(
    () => <SelectablePlugDetails plug={plug} classType={classType} />,
    [plug, classType],
  );

  const stackable = stack > 1 || (stack === 1 && selectable);

  const handleIncrease =
    stackable &&
    selectable &&
    ((e: React.MouseEvent) => {
      e.stopPropagation();
      onPlugSelected(plug);
    });

  const handleDecrease =
    stackable &&
    removable &&
    ((e: React.MouseEvent) => {
      e.stopPropagation();
      onPlugRemoved(plug);
    });

  return (
    <TileGridTile
      selected={selected}
      disabled={
        !(
          selectable ||
          canRemoveOnClick ||
          (selectionType === PlugSelectionType.Single && selected)
        )
      }
      title={plug.displayProperties.name}
      icon={
        <div className={styles.icon}>
          <div className="item" title={plug.displayProperties.name}>
            <DefItemIcon itemDef={plug} />
          </div>
          {(handleIncrease || handleDecrease) && (
            <div className={styles.buttons}>
              {handleIncrease && (
                <button
                  type="button"
                  className="dim-button"
                  onClick={handleIncrease}
                  title={t('LB.AddStack')}
                >
                  <AppIcon icon={plusIcon} />
                </button>
              )}
              {handleDecrease && (
                <button
                  type="button"
                  className="dim-button"
                  onClick={handleDecrease}
                  title={t('LB.RemoveStack')}
                >
                  <AppIcon icon={minusIcon} />
                </button>
              )}
            </div>
          )}
          {stackable && <div className={styles.stack}>{stack}x</div>}
        </div>
      }
      onClick={handleClick}
    >
      {plugDetails}
    </TileGridTile>
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
