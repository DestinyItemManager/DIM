import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { PressTip } from 'app/dim-ui/PressTip';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { PlugDefTooltip } from 'app/item-popup/PlugTooltip';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import styles from './PlugDef.m.scss';

interface Props {
  plug: PluggableInventoryItemDefinition;
  className?: string;
  onClick?: () => void;
  onClose?: () => void;
  automaticallyPicked?: boolean;
  forClassType: DestinyClass | undefined;
}

const strandWrongColorPlugCategoryHashes = [
  PlugCategoryHashes.TitanStrandClassAbilities,
  PlugCategoryHashes.HunterStrandClassAbilities,
  PlugCategoryHashes.WarlockStrandClassAbilities,
  PlugCategoryHashes.TitanStrandMovement,
  PlugCategoryHashes.HunterStrandMovement,
  PlugCategoryHashes.WarlockStrandMovement,
];

/**
 * Displays a plug (mod, perk) based on just its definition, with optional close button.
 */
export default function PlugDef({
  plug,
  className,
  onClick,
  onClose,
  automaticallyPicked,
  forClassType,
}: Props) {
  const needsStrandColorFix = strandWrongColorPlugCategoryHashes.includes(
    plug.plug.plugCategoryHash
  );
  const contents = (
    <div
      role={onClick ? 'button' : undefined}
      className={clsx('item', className, { [styles.strandColorFix]: needsStrandColorFix })}
      onClick={onClick}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={onClick ? 0 : undefined}
    >
      <PressTip
        tooltip={() => (
          <PlugDefTooltip
            def={plug}
            automaticallyPicked={automaticallyPicked}
            classType={forClassType}
          />
        )}
      >
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
