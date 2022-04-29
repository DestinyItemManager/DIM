import ClosableContainer from 'app/dim-ui/ClosableContainer';
import PressTip from 'app/dim-ui/PressTip';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { PlugTooltip } from 'app/item-popup/PlugTooltip';
import React from 'react';

interface Props {
  plug: PluggableInventoryItemDefinition;
  tooltipWarning?: string;
  className?: string;
  onClick?(): void;
  onClose?(): void;
}

/**
 * Displays a plug (mod, perk) based on just its definition, with optional close button.
 */
export default function PlugDef({ plug, tooltipWarning, className, onClick, onClose }: Props) {
  const contents = (
    <PressTip
      className={className}
      tooltip={() => <PlugTooltip def={plug} tooltipWarning={tooltipWarning} />}
    >
      <div
        role={onClick ? 'button' : undefined}
        className="item"
        onClick={onClick}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={onClick ? 0 : undefined}
      >
        <DefItemIcon itemDef={plug} />
      </div>
    </PressTip>
  );

  return onClose ? (
    <ClosableContainer onClose={onClose} showCloseIconOnHover={true}>
      {contents}
    </ClosableContainer>
  ) : (
    contents
  );
}
