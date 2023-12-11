import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { TileGridTile } from 'app/dim-ui/TileGrid';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { PlugStats } from 'app/item-popup/PlugTooltip';
import { getPlugDefStats, usePlugDescriptions } from 'app/utils/plug-descriptions';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import unstackableModHashes from 'data/d2/unstackable-mods.json';
import React, { useCallback, useMemo } from 'react';
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
  selectionType: 'multi' | 'unique' | 'single';
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
    [plug, classType],
  );

  return (
    <ClosableContainer onClose={selected && removable ? onClose : undefined}>
      <TileGridTile
        selected={selected}
        disabled={selectionType !== 'single' && !selectable}
        title={plug.displayProperties.name}
        icon={
          <div className="item" title={plug.displayProperties.name}>
            <DefItemIcon itemDef={plug} />
          </div>
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
  const plugDescriptions = usePlugDescriptions(plug, stats, /* forceUseBungieDescriptions */ true);

  // addDescriptionAsRequirement addPerkDescriptions GARDEM USES THESE
  return (
    <>
      {plugDescriptions.perks.map((perkDesc, index) => (
        <React.Fragment key={perkDesc.perkHash}>
          {perkDesc.description && <RichDestinyText text={perkDesc.description} />}
          {perkDesc.requirement && index === plugDescriptions.perks.length - 1 ? (
            <div className={styles.requirement}>
              {unstackableModHashes.includes(perkDesc.hash)
                ? t('Loadouts.ModPlacement.UnstackableMod')
                : t('Loadouts.ModPlacement.StackableMod')}
            </div>
          ) : (
            <div className={styles.requirement}>{perkDesc.requirement}</div>
          )}
        </React.Fragment>
      ))}
      {stats.length > 0 && <PlugStats stats={stats} />}
    </>
  );
}
