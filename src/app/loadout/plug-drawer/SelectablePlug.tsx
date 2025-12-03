import ClarityDescriptions from 'app/clarity/descriptions/ClarityDescriptions';
import { TileGridTile } from 'app/dim-ui/TileGrid';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { PlugStats } from 'app/item-popup/PlugTooltip';
import { banIcon, minusIcon, plusIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { getPlugDefStats, usePlugDescriptions } from 'app/utils/plug-descriptions';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { useCallback, useMemo } from 'react';
import PlugStackableIcon from './PlugStackableIcon';
import * as styles from './SelectablePlug.m.scss';
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
    stackable && selectable
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          onPlugSelected(plug);
        }
      : undefined;

  const handleDecrease =
    stackable && removable
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          onPlugRemoved(plug);
        }
      : undefined;

  const corner =
    handleIncrease || handleDecrease || stackable ? (
      <div className={styles.buttons}>
        {stackable && <div className={styles.stack}>{stack}×</div>}
        {(handleIncrease || handleDecrease) && (
          <div className={styles.volumeRocker}>
            <button
              type="button"
              className="dim-button"
              onClick={handleIncrease}
              disabled={!handleIncrease}
              title={t('LB.AddStack')}
            >
              <AppIcon icon={plusIcon} />
            </button>
            <button
              type="button"
              className="dim-button"
              onClick={handleDecrease}
              disabled={!handleDecrease}
              title={t('LB.RemoveStack')}
            >
              <AppIcon icon={stack === 1 ? banIcon : minusIcon} />
            </button>
          </div>
        )}
      </div>
    ) : undefined;

  return (
    <TileGridTile
      selected={selected}
      disabled={
        !(
          (stackable && (selectable || removable)) ||
          selectable ||
          canRemoveOnClick ||
          (selectionType === PlugSelectionType.Single && selected)
        )
      }
      title={plug.displayProperties.name}
      icon={
        <div className="item" title={plug.displayProperties.name}>
          <DefItemIcon itemDef={plug} />
        </div>
      }
      onClick={handleClick}
      corner={corner}
      compact={[
        PlugCategoryHashes.EnhancementsArtifice,
        PlugCategoryHashes.EnhancementsV2General,
        PlugCategoryHashes.CoreGearSystemsArmorTieringPlugsTuningMods,
      ].includes(plug.plug?.plugCategoryHash)}
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
  const stats = getPlugDefStats(plug, classType, undefined);

  const plugDescriptions = usePlugDescriptions(plug, stats);

  return (
    <>
      {plugDescriptions.perks.map(
        (perkDesc) =>
          perkDesc.description &&
          !perkDesc.description.match(/^\+.*▲/m) && (
            <RichDestinyText key={perkDesc.perkHash} text={perkDesc.description} />
          ),
      )}
      <PlugStackableIcon descriptions={plugDescriptions} hash={plug.hash} />
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
