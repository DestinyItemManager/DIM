import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { useD1Definitions } from 'app/manifest/selectors';
import Objective from 'app/progress/Objective';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { DestinyAccount } from '../../accounts/destiny-account';
import CharacterTileButton from '../../character-tile/CharacterTileButton';
import BungieImage, { bungieBackgroundStyle } from '../../dim-ui/BungieImage';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import { sortedStoresSelector } from '../../inventory/selectors';
import { D1Store } from '../../inventory/store-types';
import { AppIcon, starIcon } from '../../shell/icons';
import { D1ManifestDefinitions } from '../d1-definitions';
import { D1ActivityComponent, D1ActivityTier, D1ObjectiveProgress } from '../d1-manifest-types';
import './activities.scss';

interface Skull {
  displayName: string;
  description: string;
  icon: string;
}

interface Activity {
  hash: number;
  name: string;
  icon: string;
  image: string;
  type: string;
  skulls: Skull[] | null;
  tiers: ActivityTier[];
  featured?: boolean;
}

interface ActivityTier {
  hash: number;
  icon: string;
  name: string;
  complete: boolean;
  characters: {
    name: string;
    lastPlayed: Date;
    id: string;
    icon: string;
    steps: { complete: boolean }[];
    objectives: D1ObjectiveProgress[];
  }[];
}

interface Props {
  account: DestinyAccount;
}

export default function Activities({ account }: Props) {
  useLoadStores(account);
  const stores = useSelector(sortedStoresSelector);

  const defs = useD1Definitions();

  if (!defs || !stores.length) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  const processActivity = (
    defs: D1ManifestDefinitions,
    activityId: string,
    stores: D1Store[],
    tier: D1ActivityTier,
    index: number
  ): ActivityTier => {
    const tierDef = defs.Activity.get(tier.activityHash);

    const name =
      tier.activityData.recommendedLight === 390
        ? '390'
        : tier.tierDisplayName
        ? t(`Activities.${tier.tierDisplayName}`, { contextList: 'difficulty' })
        : tierDef.activityName;

    const characters =
      activityId === 'heroicstrike'
        ? []
        : stores.map((store) => {
            const activity = store.advisors.activities![activityId];
            let steps = activity.activityTiers[index].steps;

            if (!steps) {
              steps = [activity.activityTiers[index].completion];
            }

            const objectives = activity.extended?.objectives || [];

            return {
              name: store.name,
              lastPlayed: store.lastPlayed,
              id: store.id,
              icon: store.icon,
              steps,
              objectives,
            };
          });

    return {
      hash: tierDef.activityHash,
      icon: tierDef.icon,
      name,
      complete: tier.activityData.isCompleted,
      characters,
    };
  };

  const processActivities = (
    defs: D1ManifestDefinitions,
    stores: D1Store[],
    rawActivity: D1ActivityComponent
  ): Activity => {
    const def = defs.Activity.get(rawActivity.display.activityHash);
    const activity = {
      hash: rawActivity.display.activityHash,
      name: def.activityName,
      icon: rawActivity.display.icon,
      image: rawActivity.display.image,
      type:
        rawActivity.identifier === 'nightfall'
          ? t('Activities.Nightfall')
          : rawActivity.identifier === 'heroicstrike'
          ? t('Activities.WeeklyHeroic')
          : defs.ActivityType.get(def.activityTypeHash).activityTypeName,
      skulls: null as Skull[] | null,
      tiers: [] as ActivityTier[],
    };

    if (rawActivity.extended) {
      activity.skulls = rawActivity.extended.skullCategories.flatMap((s) => s.skulls);
    }

    const rawSkullCategories = rawActivity.activityTiers[0].skullCategories;
    if (rawSkullCategories?.length) {
      activity.skulls = rawSkullCategories[0].skulls.flat();
    }

    if (activity.skulls) {
      activity.skulls = i18nActivitySkulls(activity.skulls, defs);
    }

    // flatten modifiers and bonuses for now.
    if (activity.skulls) {
      activity.skulls = activity.skulls.flat();
    }
    activity.tiers = rawActivity.activityTiers.map((r, i) =>
      processActivity(defs, rawActivity.identifier, stores, r, i)
    );

    return activity;
  };

  const init = (stores: D1Store[], defs: D1ManifestDefinitions) => {
    const allowList = [
      'vaultofglass',
      'crota',
      'kingsfall',
      'wrathofthemachine',
      'nightfall',
      'heroicstrike',
      'elderchallenge',
    ];

    const rawActivities = Object.values(stores[0].advisors.activities!).filter(
      (a: any) => a.activityTiers && allowList.includes(a.identifier)
    );
    const activities = _.sortBy(rawActivities, (a: any) => {
      const ix = allowList.indexOf(a.identifier);
      return ix === -1 ? 999 : ix;
    }).map((a) => processActivities(defs, stores, a));

    activities.forEach((a) => {
      a.tiers.forEach((t) => {
        if (t.hash === stores[0].advisors.activities!.weeklyfeaturedraid.display.activityHash) {
          a.featured = true;
          t.name = t.hash === 1387993552 ? '390' : t.name;
        }
      });
    });

    return activities;
  };

  const characters = stores.filter((s) => !s.isVault);

  const activities = init(characters as D1Store[], defs);

  return (
    <div className="activities dim-page">
      <div className="activities-characters">
        {characters.map((store) => (
          <div key={store.id} className="activities-character">
            <CharacterTileButton character={store} />
          </div>
        ))}
      </div>

      {activities.map((activity) => (
        <div key={activity.hash} className="activity">
          <CollapsibleTitle
            style={bungieBackgroundStyle(activity.image)}
            className={clsx('title activity-header', {
              'activity-featured': activity.featured,
            })}
            sectionId={`activities-${activity.hash}`}
            title={
              <>
                <BungieImage src={activity.icon} className="small-icon" />
                <span className="activity-name">{activity.name}</span>
                {activity.featured && <AppIcon icon={starIcon} />}
              </>
            }
            extra={<span className="activity-type">{activity.type}</span>}
          >
            <div className="activity-info">
              {activity.tiers.map((tier) => (
                <div key={tier.name} className="activity-progress">
                  {activity.tiers.length > 1 && <div className="tier-title">{tier.name}</div>}
                  <div className="tier-characters">
                    {_.sortBy(tier.characters, (c) =>
                      characters.findIndex((s) => s.id === c.id)
                    ).map((character) => (
                      <div key={character.id} className="tier-row">
                        {character.objectives.length === 0 &&
                          character.steps.map((step, index) => (
                            <span
                              key={index}
                              className={clsx('step-icon', { complete: step.complete })}
                            />
                          ))}
                        {character.objectives.map((objective) => (
                          <Objective objective={objective} key={objective.objectiveHash} />
                        ))}
                        {character.objectives.length > 0 && <div className="objectives-spacer" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {activity.skulls?.map((skull) => (
                <div key={skull.displayName} className="activity-skulls">
                  <BungieImage src={skull.icon} className="small-icon" />
                  {skull.displayName}
                  <span className="weak"> - {skull.description}</span>
                </div>
              ))}
            </div>
          </CollapsibleTitle>
        </div>
      ))}
    </div>
  );
}

const skullHashesByName: { [name: string]: number | undefined } = {
  Heroic: 0,
  'Arc Burn': 1,
  'Solar Burn': 2,
  'Void Burn': 3,
  Berserk: 4,
  Brawler: 5,
  Lightswitch: 6,
  'Small Arms': 7,
  Specialist: 8,
  Juggler: 9,
  Grounded: 10,
  Bloodthirsty: 11,
  Chaff: 12,
  'Fresh Troops': 13,
  Ironclad: 14,
  'Match Game': 15,
  Exposure: 16,
  Airborne: 17,
  Catapult: 18,
  Epic: 20,
};

function i18nActivitySkulls(skulls: Skull[], defs: D1ManifestDefinitions): Skull[] {
  const activity = {
    heroic: defs.Activity.get(870614351),
    epic: defs.Activity.get(2234107290),
  };

  skulls.forEach((skull) => {
    const hash = skullHashesByName[skull.displayName];
    if (hash) {
      if (hash === 20) {
        skull.displayName = activity.epic.skulls[0].displayName;
        skull.description = activity.epic.skulls[0].description;
      } else if (activity.heroic.skulls[hash]) {
        skull.displayName = activity.heroic.skulls[hash].displayName;
        skull.description = activity.heroic.skulls[hash].description;
      }
    }
  });
  return skulls;
}
