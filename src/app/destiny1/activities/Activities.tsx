import CharacterTile from 'app/character-tile/CharacterTile';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { useD1Definitions } from 'app/manifest/selectors';
import Objective from 'app/progress/Objective';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { compareBy, compareByIndex } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { usePageTitle } from 'app/utils/hooks';
import { StringLookup } from 'app/utils/util-types';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { DestinyAccount } from '../../accounts/destiny-account';
import BungieImage, { bungieBackgroundStyle } from '../../dim-ui/BungieImage';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import { sortedStoresSelector } from '../../inventory/selectors';
import { D1Store } from '../../inventory/store-types';
import { AppIcon, starIcon } from '../../shell/icons';
import { D1ManifestDefinitions } from '../d1-definitions';
import { D1ActivityComponent, D1ActivityTier, D1ObjectiveProgress } from '../d1-manifest-types';
import * as styles from './Activities.m.scss';

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

export default function Activities({ account }: { account: DestinyAccount }) {
  usePageTitle(t('Activities.Activities'));
  const storesLoaded = useLoadStores(account);
  const stores = useSelector(sortedStoresSelector);
  const isPhonePortrait = useIsPhonePortrait();

  const defs = useD1Definitions();
  const characters = stores.filter((s) => !s.isVault) as D1Store[];

  const [selectedStoreId, setSelectedStoreId] = useState<string>();
  const selectedStore =
    (stores.find((store) => store.id === selectedStoreId) as D1Store) || characters[0];

  const activities = useActivities(
    defs,
    isPhonePortrait && storesLoaded ? [selectedStore] : characters,
  );

  if (!defs || !storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <div className={styles.activities}>
      {isPhonePortrait ? (
        <CharacterSelect
          selectedStore={selectedStore}
          stores={characters}
          onCharacterChanged={setSelectedStoreId}
        />
      ) : (
        <div className={styles.characters}>
          {characters.map((store) => (
            <CharacterTile key={store.id} store={store} />
          ))}
        </div>
      )}

      {activities.map((activity) => (
        <div key={activity.hash}>
          <CollapsibleTitle
            style={bungieBackgroundStyle(activity.image)}
            className={clsx(styles.title, {
              [styles.featured]: activity.featured,
            })}
            sectionId={`activities-${activity.hash}`}
            title={
              <>
                <BungieImage src={activity.icon} className={styles.smallIcon} />
                <span>{activity.name}</span>
                {activity.featured && <AppIcon icon={starIcon} />}
              </>
            }
            extra={<span className={styles.activityType}>{activity.type}</span>}
          >
            <div className={styles.activityInfo}>
              {activity.tiers.map(
                (tier) =>
                  tier.characters.some((c) => c.objectives.length || c.steps.length) && (
                    <div key={tier.name}>
                      {activity.tiers.length > 1 && (
                        <div className={styles.tierTitle}>{tier.name}</div>
                      )}
                      <div className={styles.tierCharacters}>
                        {tier.characters
                          .toSorted(compareBy((c) => characters.findIndex((s) => s.id === c.id)))
                          .map(
                            (character) =>
                              (!isPhonePortrait || character.id === selectedStore.id) && (
                                <div key={character.id}>
                                  {character.objectives.length === 0 &&
                                    character.steps.length > 0 && (
                                      <div className={styles.steps}>
                                        {character.steps.map((step, index) => (
                                          <span
                                            key={index}
                                            className={clsx(styles.stepIcon, {
                                              [styles.complete]: step.complete,
                                            })}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  {character.objectives.map((objective) => (
                                    <Objective
                                      objective={objective}
                                      key={objective.objectiveHash}
                                    />
                                  ))}
                                </div>
                              ),
                          )}
                      </div>
                    </div>
                  ),
              )}
              {activity.skulls && (
                <div className={styles.skulls}>
                  {activity.skulls?.map((skull) => (
                    <div key={skull.displayName}>
                      <BungieImage src={skull.icon} className={styles.skullIcon} />
                      {skull.displayName}
                      <span className={styles.weak}> - {skull.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleTitle>
        </div>
      ))}
    </div>
  );
}

function useActivities(defs: D1ManifestDefinitions | undefined, characters: D1Store[]): Activity[] {
  return useMemo(() => {
    const processActivity = (
      defs: D1ManifestDefinitions,
      activityId: string,
      stores: D1Store[],
      tier: D1ActivityTier,
      index: number,
    ): ActivityTier => {
      const tierDef = defs.Activity.get(tier.activityHash);

      const name =
        tier.activityData.recommendedLight === 390
          ? '390'
          : tier.tierDisplayName
            ? t(`Activities.${tier.tierDisplayName}`, {
                metadata: { keys: 'difficulty' },
              })
            : tierDef.activityName;

      const characters =
        activityId === 'heroicstrike'
          ? []
          : stores.map((store) => {
              const activity = store.advisors.activities[activityId];
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
      rawActivity: D1ActivityComponent,
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
        processActivity(defs, rawActivity.identifier, stores, r, i),
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

      const activities = Object.values(stores[0].advisors.activities)
        .filter((a) => a.activityTiers && allowList.includes(a.identifier))
        .sort(compareByIndex(allowList, (a) => a.identifier))
        .map((a) => processActivities(defs, stores, a));

      for (const a of activities) {
        for (const t of a.tiers) {
          if (t.hash === stores[0].advisors.activities.weeklyfeaturedraid.display.activityHash) {
            a.featured = true;
            t.name = t.hash === 1387993552 ? '390' : t.name;
          }
        }
      }

      return activities;
    };

    if (!defs || !characters.length) {
      return emptyArray();
    }
    return init(characters, defs);
  }, [characters, defs]);
}

const skullHashesByName: StringLookup<number> = {
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

  for (const skull of skulls) {
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
  }
  return skulls;
}
