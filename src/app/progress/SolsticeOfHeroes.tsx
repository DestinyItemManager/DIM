import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getEvent, getSeason } from 'app/inventory/store/season';
import { D2EventEnum } from 'data/d2/d2-event-info';
import _ from 'lodash';
import React from 'react';
import Objective from './Objective';
import Pursuit from './Pursuit';
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

export function solsticeOfHeroesArmor(allItems: DimItem[], selectedStore: DimStore) {
  return _.sortBy(
    allItems.filter(
      (item) =>
        item.bucket.inArmor &&
        item.objectives &&
        item.objectives.length > 0 &&
        item.classType === selectedStore.classType &&
        getEvent(item) === D2EventEnum.SOLSTICE_OF_HEROES &&
        getSeason(item) === 11
    ),
    (i) => D2Categories.Armor.indexOf(i.type)
  );
}
