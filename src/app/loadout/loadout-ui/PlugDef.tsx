import ClosableContainer from 'app/dim-ui/ClosableContainer';
import PressTip from 'app/dim-ui/PressTip';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { PlugTooltip } from 'app/item-popup/PlugTooltip';
import React from 'react';

interface Props {
  plug: PluggableInventoryItemDefinition;
  onClick?(): void;
  onClose?(): void;
}

/**
 * Displays a plug (mod, perk) based on just its definition, with optional close button.
 */
export default function PlugDef({ plug, onClick, onClose }: Props) {
  const contents = (
    <PressTip tooltip={() => <PlugTooltip def={plug} />}>
      <div role="button" className="item" onClick={onClick} tabIndex={0}>
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
