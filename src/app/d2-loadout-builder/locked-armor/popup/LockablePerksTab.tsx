import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { t } from 'i18next';
import * as React from 'react';
import { LockedItemType, BurnItem } from '../../types';
import SelectableBungieImage from './SelectableBungieImage';
import SelectableBurn from './SelectableBurn';

export default function LockablePerks({
  perks,
  filteredPerks,
  locked,
  hoveredPerk,
  onPerkHover,
  toggleLockedPerk
}: {
  perks: Set<DestinyInventoryItemDefinition>;
  filteredPerks: Set<DestinyInventoryItemDefinition>;
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

  const burns: BurnItem[] = [
    {
      index: 'arc',
      displayProperties: {
        name: t('LoadoutBuilder.BurnTypeArc'),
        icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/arc.png'
      }
    },
    {
      index: 'solar',
      displayProperties: {
        name: t('LoadoutBuilder.BurnTypeSolar'),
        icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/thermal.png'
      }
    },
    {
      index: 'void',
      displayProperties: {
        name: t('LoadoutBuilder.BurnTypeVoid'),
        icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/void.png'
      }
    }
  ];

  return (
    <>
      <div>{t('LoadoutBuilder.LockPerksTitle')}</div>
      <div className="add-perk-options-content" onMouseLeave={resetHover}>
        {perks &&
          Array.from(perks).map((perk) => (
            <SelectableBungieImage
              key={perk.hash}
              selected={Boolean(locked && locked.some((p) => p.item.index === perk.index))}
              unselectable={filteredPerks && !filteredPerks.has(perk)}
              perk={perk}
              onLockedPerk={toggleLockedPerk}
              onHoveredPerk={setHoveredPerk}
            />
          ))}
        {burns.map((burn) => (
          <SelectableBurn
            key={burn.index}
            burn={burn}
            selected={Boolean(locked && locked.some((p) => p.item.index === burn.index))}
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
