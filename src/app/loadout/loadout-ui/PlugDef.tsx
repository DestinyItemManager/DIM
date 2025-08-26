import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { PressTip } from 'app/dim-ui/PressTip';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { PlugDefTooltip } from 'app/item-popup/PlugTooltip';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';

/**
 * Displays a plug (mod, perk) based on just its definition, with optional close button.
 */
export default function PlugDef({
  plug,
  className,
  onClick,
  onClose,
  automaticallyPicked,
  disabledByAutoStatMods,
  forClassType,
  item,
}: {
  plug: PluggableInventoryItemDefinition;
  className?: string;
  onClick?: () => void;
  onClose?: () => void;
  automaticallyPicked?: boolean;
  disabledByAutoStatMods?: boolean;
  /** The class this plug is or will be plugged into, if we don't have the item. */
  forClassType?: DestinyClass;
  /** The item this plug is or will be plugged into. */
  item?: DimItem;
}) {
  const contents = (
    <div
      role={onClick ? 'button' : undefined}
      className={clsx('item', className)}
      onClick={onClick}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={onClick ? 0 : undefined}
    >
      <PressTip
        tooltip={() => (
          <PlugDefTooltip
            def={plug}
            automaticallyPicked={automaticallyPicked}
            disabledByAutoStatMods={disabledByAutoStatMods}
            classType={forClassType}
            item={item}
          />
        )}
      >
        <DefItemIcon className={disabledByAutoStatMods ? 'disabled' : undefined} itemDef={plug} />
      </PressTip>
    </div>
  );

  return onClose ? <ClosableContainer onClose={onClose}>{contents}</ClosableContainer> : contents;
}
