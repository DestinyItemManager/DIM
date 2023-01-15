import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { PressTip } from 'app/dim-ui/PressTip';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { PlugTooltip } from 'app/item-popup/PlugTooltip';
import clsx from 'clsx';

interface Props {
  plug: PluggableInventoryItemDefinition;
  className?: string;
  onClick?(): void;
  onClose?(): void;
}

/**
 * Displays a plug (mod, perk) based on just its definition, with optional close button.
 */
export default function PlugDef({ plug, className, onClick, onClose }: Props) {
  const contents = (
    <div
      role={onClick ? 'button' : undefined}
      className={clsx('item', className)}
      onClick={onClick}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={onClick ? 0 : undefined}
    >
      <PressTip tooltip={() => <PlugTooltip def={plug} />}>
        <DefItemIcon itemDef={plug} />
      </PressTip>
    </div>
  );

  return onClose ? (
    <ClosableContainer onClose={onClose} showCloseIconOnHover={true}>
      {contents}
    </ClosableContainer>
  ) : (
    contents
  );
}
