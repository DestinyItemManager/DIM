import React from 'react';
import Pursuit from './Pursuit';
import _ from 'lodash';
import { DimStore } from 'app/inventory/store-types';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import { D2EventEnum } from 'data/d2/d2-event-info';
import { DimItem } from 'app/inventory/item-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import Objective from './Objective';
import './SolsticeOfHeroes.scss';

/**
 * List out all the Pursuits for the character, grouped out in a useful way.
 */
export default function SolsticeOfHeroes({
  armor,
  defs,
  title,
}: {
  title: string;
  armor: DimItem[];
  defs?: D2ManifestDefinitions;
}) {
  if (!defs) {
    return null;
  }

  if (!armor.length) {
    return null;
  }

  return (
    <section id="solstice">
      <CollapsibleTitle title={title} sectionId="solstice">
        <div className="progress-row">
          <ErrorBoundary name="Solstice">
            <div className="progress-for-character">
              {armor.map((item) => (
                <div key={item.id} className="solsticeProgressBox">
                  <Pursuit item={item} key={item.index} defs={defs} />
                  {item.objectives?.map((objective) => (
                    <Objective defs={defs} objective={objective} key={objective.objectiveHash} />
                  ))}
                </div>
              ))}
            </div>
          </ErrorBoundary>
        </div>
      </CollapsibleTitle>
    </section>
  );
}

export function solsticeOfHeroesArmor(stores: DimStore[], selectedStore: DimStore) {
  return _.sortBy(
    stores.flatMap((store) =>
      store.items.filter(
        (item) =>
          item.bucket.inArmor &&
          item.isDestiny2() &&
          item.objectives &&
          item.objectives.length > 0 &&
          item.classType === selectedStore.classType &&
          item.event === D2EventEnum.SOLSTICE_OF_HEROES &&
          item.season === 11
      )
    ),
    (i) => D2Categories.Armor.indexOf(i.type)
  );
}
