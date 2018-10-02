import * as React from 'react';
import { LockType } from './LoadoutBuilder';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import SelectableBungieImage from './SelectableBungieImage';

export default function LockablePerks({
  perks,
  locked,
  hoveredPerk,
  onPerkHover,
  toggleLockedPerk,
  reset
}: {
  perks: DestinyInventoryItemDefinition[];
  locked?: LockType;
  hoveredPerk?: {
    name: string;
    description: string;
  };
  onPerkHover(hoveredPerk?: {}): void;
  toggleLockedPerk(perk: DestinyInventoryItemDefinition): void;
  reset(): void;
}) {
  const isLocked = locked && locked.items && locked.items.length !== 0;

  const resetHover = () => {
    onPerkHover();
  };

  const setHoveredPerk = (hoveredPerk) => {
    onPerkHover(hoveredPerk);
  };

  return (
    <>
      {isLocked && (
        <button className="clear" onClick={reset}>
          Reset
        </button>
      )}

      <div>Select perks to lock</div>
      <div className="add-perk-options-content" onMouseLeave={resetHover}>
        {perks &&
          perks.map((perk) => (
            <SelectableBungieImage
              key={perk.hash}
              selected={isLocked! && locked!.items.some((p) => p.hash === perk.hash)}
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
