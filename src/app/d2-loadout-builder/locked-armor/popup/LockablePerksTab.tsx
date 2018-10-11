import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { t } from 'i18next';
import * as React from 'react';
import { LockedItemType } from '../../types';
import SelectableBungieImage from './SelectableBungieImage';

export default function LockablePerks({
  perks,
  locked,
  hoveredPerk,
  onPerkHover,
  toggleLockedPerk
}: {
  perks: Set<DestinyInventoryItemDefinition>;
  locked?: LockedItemType[];
  hoveredPerk?: {
    name: string;
    description: string;
  };
  onPerkHover(hoveredPerk?: {}): void;
  toggleLockedPerk(perk: LockedItemType): void;
}) {
  const resetHover = () => {
    onPerkHover();
  };

  const setHoveredPerk = (hoveredPerk) => {
    onPerkHover(hoveredPerk);
  };

  return (
    <>
      <div>{t('LoadoutBuilder.LockPerksTitle')}</div>
      <div className="add-perk-options-content" onMouseLeave={resetHover}>
        {perks &&
          Array.from(perks).map((perk) => (
            <SelectableBungieImage
              key={perk.hash}
              selected={Boolean(locked && locked.some((p) => p.item.hash === perk.hash))}
              perk={perk}
              onLockedPerk={toggleLockedPerk}
              onHoveredPerk={setHoveredPerk}
            />
          ))}
      </div>

      {hoveredPerk && (
        <div className="add-perk-options-details">
          <h3>{hoveredPerk.name}</h3>
          <div>{hoveredPerk.description}</div>
        </div>
      )}
    </>
  );
}
