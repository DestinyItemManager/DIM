import ClosableContainer from 'app/dim-ui/ClosableContainer';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { StatValue } from 'app/item-popup/PlugTooltip';
import { DefItemIcon } from 'app/item/ItemIcon';
import { useD2Definitions } from 'app/manifest/selectors';
import { ItemPerkVisibility } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React, { useCallback, useMemo } from 'react';
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
  const defs = useD2Definitions()!;

  const displayedStats = plug.investmentStats.filter((stat) =>
    displayedStatHashes?.includes(stat.statTypeHash)
  );

  // within this plug, let's not repeat any descriptions or requirement strings
  const uniqueStrings = new Set<string>();

  // filter out things with no displayable text, or that are meant to be hidden
  const perksToDisplay = plug.perks.filter((perk) => {
    if (perk.perkVisibility === ItemPerkVisibility.Hidden) {
      return false;
    }
    let perkDescription =
      defs.SandboxPerk.get(perk.perkHash).displayProperties.description || undefined;
    let perkRequirement = perk.requirementDisplayString || undefined;

    if (uniqueStrings.has(perkDescription!)) {
      perkDescription = undefined;
    }
    if (uniqueStrings.has(perkRequirement!)) {
      perkRequirement = undefined;
    }

    perkDescription && uniqueStrings.add(perkDescription);
    perkRequirement && uniqueStrings.add(perkRequirement);
    return perkDescription || perkRequirement;
  });

  let plugDescription = plug.displayProperties.description || undefined;
  // don't repeat plug description if it's already going to appear in perks
  if (uniqueStrings.has(plugDescription!)) {
    plugDescription = undefined;
  }

  // a fallback: if there's no description, and we filtered down to zero perks,
  // at least keep the first perk for display. there are mods like this: no desc,
  // and annoyingly all perks are set to ItemPerkVisibility.Hidden
  if (!plugDescription && !perksToDisplay.length && plug.perks.length) {
    perksToDisplay.push(plug.perks[0]);
  }

  return (
    <>
      <div className={clsx('item', styles.iconContainer)} title={plug.displayProperties.name}>
        <DefItemIcon itemDef={plug} />
      </div>
      <div className={styles.plugInfo}>
        <div className={styles.plugTitle}>{plug.displayProperties.name}</div>
        {perksToDisplay.map((perk) => {
          const perkDescription = defs.SandboxPerk.get(perk.perkHash).displayProperties.description;
          const perkRequirement = perk.requirementDisplayString;

          return (
            <div className={styles.partialDescription} key={perk.perkHash}>
              <RichDestinyText text={perkDescription} />
              {perkRequirement && <div className={styles.requirement}>{perkRequirement}</div>}{' '}
            </div>
          );
        })}
        {plug.displayProperties.description &&
          !uniqueStrings.has(plug.displayProperties.description) && (
            // if uniqueStrings has entries, then we printed some perks. if that's true,
            // and description is still unique, this means description is basically a "requirements"
            // string like "This mod's perks are only active" etc etc etc
            <div className={uniqueStrings.size ? styles.requirement : styles.partialDescription}>
              <RichDestinyText text={plug.displayProperties.description} />
            </div>
          )}
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
