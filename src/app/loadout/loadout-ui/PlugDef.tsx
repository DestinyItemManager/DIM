import ClosableContainer from 'app/dim-ui/ClosableContainer';
import PressTip from 'app/dim-ui/PressTip';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { PlugTooltip } from 'app/item-popup/PlugTooltip';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import React from 'react';

interface Props {
  plug: PluggableInventoryItemDefinition;
  onClick?(): void;
  onClose?(): void;
}

export default function PlugDef({ plug, onClick, onClose }: Props) {
  const isPhonePortrait = useIsPhonePortrait();
  const defs = useD2Definitions();
  const showTooltip = defs && !isPhonePortrait;

  const contents = (
    <div
      role="button"
      className="item"
      title={showTooltip ? undefined : plug.displayProperties.name}
      onClick={onClick}
      tabIndex={0}
    >
      <DefItemIcon itemDef={plug} />
    </div>
  );

  return (
    <ClosableContainer onClose={onClose} showCloseIconOnHover={true}>
      {showTooltip ? (
        <PressTip tooltip={() => <PlugTooltip def={plug} />}>{contents}</PressTip>
      ) : (
        contents
      )}
    </ClosableContainer>
  );
}
