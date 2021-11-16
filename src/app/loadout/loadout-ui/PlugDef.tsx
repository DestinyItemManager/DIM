import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import PressTip from 'app/dim-ui/PressTip';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import _ from 'lodash';
import React from 'react';
import styles from './PlugDef.m.scss';

interface Props {
  plug: PluggableInventoryItemDefinition;
  onClick?(): void;
  onClose?(): void;
}

export default function PlugDef({ plug, onClick, onClose }: Props) {
  const isPhonePortrait = useIsPhonePortrait();
  const defs = useD2Definitions();

  const contents = (
    <div className={styles.emptyItem}>
      <SocketDetailsMod itemDef={plug} onClick={onClick} />
    </div>
  );

  return (
    <ClosableContainer onClose={onClose} showCloseIconOnHover={true}>
      <div className={styles.emptyItem}>
        {defs && !isPhonePortrait ? (
          <PressTip tooltip={<ToolTip plug={plug} defs={defs} />}>{contents}</PressTip>
        ) : (
          contents
        )}
      </div>
    </ClosableContainer>
  );
}

function ToolTip({
  plug,
  defs,
}: {
  plug: PluggableInventoryItemDefinition;
  defs: D2ManifestDefinitions;
}) {
  return plug.displayProperties.description ? (
    <div>
      <RichDestinyText text={plug.displayProperties.description} />
    </div>
  ) : (
    <>
      {_.uniqBy(
        plug.perks,
        (p) => defs.SandboxPerk.get(p.perkHash).displayProperties.description
      ).map((perk) => (
        <div key={perk.perkHash}>
          <RichDestinyText
            text={defs.SandboxPerk.get(perk.perkHash).displayProperties.description}
          />
          {perk.requirementDisplayString && <div>{perk.requirementDisplayString}</div>}
        </div>
      ))}
    </>
  );
}
