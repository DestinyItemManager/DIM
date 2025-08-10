import { DimStore } from 'app/inventory/store-types';
import { useCurrentSetBonus } from 'app/inventory/store/hooks';
import { SetPerk } from 'app/item-popup/SetBonus';
import React from 'react';

export function CharacterSetBonus({ store }: { store: DimStore }) {
  const setBonusStatus = useCurrentSetBonus(store.id);

  return (
    <>
      {Object.values(setBonusStatus.activeSetBonuses).map((sb) => (
        <React.Fragment key={sb!.setBonus.hash}>
          {Object.values(sb!.activePerks).map((p) => (
            <SetPerk
              key={p.def.hash}
              requiredSetCount={p.requirement}
              perkDef={p.def}
              setBonus={sb!.setBonus}
              store={store}
              active
              noLabel
              showEquipped
            />
          ))}
        </React.Fragment>
      ))}
    </>
  );
}
