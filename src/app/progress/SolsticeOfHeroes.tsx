import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import { DimItem } from 'app/inventory-stores/item-types';
import { DimStore } from 'app/inventory-stores/store-types';
import { getEvent, getSeason } from 'app/inventory-stores/store/season';
import { useD2Definitions } from 'app/manifest/selectors';
import { D2EventEnum } from 'data/d2/d2-event-info';
import _ from 'lodash';
import React from 'react';
import Objective from './Objective';
import Pursuit from './Pursuit';
import './SolsticeOfHeroes.scss';

/**
 * List out all the Pursuits for the character, grouped out in a useful way.
 */
export default function SolsticeOfHeroes({ armor, title }: { title: string; armor: DimItem[] }) {
  const defs = useD2Definitions()!;
  if (!armor.length) {
    return null;
  }

  return (
    <section id="solstice">
      <CollapsibleTitle title={title} sectionId="solstice">
        <div className="progress-row">
          <ErrorBoundary name="Solstice">
            <div className="progress-for-character">
              {armor.map((item) => {
                const description = defs.InventoryItem.get(item.hash).flavorText;
                return (
                  <div key={item.id} className="solsticeProgressBox">
                    <Pursuit item={{ ...item, description }} key={item.index} />
                    {item.objectives?.map((objective) => (
                      <Objective objective={objective} key={objective.objectiveHash} />
                    ))}
                  </div>
                );
              })}
            </div>
          </ErrorBoundary>
        </div>
      </CollapsibleTitle>
    </section>
  );
}

export function solsticeOfHeroesArmor(allItems: DimItem[], selectedStore: DimStore) {
  return _.sortBy(
    allItems.filter(
      (item) =>
        item.bucket.inArmor &&
        item.objectives &&
        item.objectives.length > 0 &&
        item.classType === selectedStore.classType &&
        getEvent(item) === D2EventEnum.SOLSTICE_OF_HEROES &&
        getSeason(item) === 14
    ),
    (i) => D2Categories.Armor.indexOf(i.type)
  );
}
