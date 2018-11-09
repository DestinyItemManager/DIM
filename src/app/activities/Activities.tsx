import * as React from 'react';
import classNames from 'classnames';
import BungieImage, { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import { DimStore, D1Store } from '../inventory/store-types';
import { RootState } from '../store/reducers';
import { sortedStoresSelector } from '../inventory/reducer';
import SimpleCharacterTile from '../inventory/SimpleCharacterTile';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import { AppIcon, starIcon } from '../shell/icons';
import { t } from 'i18next';
import * as _ from 'lodash';
import { D1ManifestDefinitions, getDefinitions } from '../destiny1/d1-definitions.service';
import { D1StoresService } from '../inventory/d1-stores.service';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { Loading } from '../dim-ui/Loading';
import { connect } from 'react-redux';
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
  }[];
}

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  stores: DimStore[];
}

type Props = ProvidedProps & StoreProps;

interface State {
  defs?: D1ManifestDefinitions;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: sortedStoresSelector(state)
  };
}

class Activities extends React.Component<Props, State> {
  state: State = {};

  componentDidMount() {
    getDefinitions().then((defs) => this.setState({ defs }));
    D1StoresService.getStoresStream(this.props.account);
  }

  render() {
    const { stores } = this.props;
    const { defs } = this.state;

    if (!defs || !stores.length) {
      return (
        <div className="activities dim-page">
          <Loading />
        </div>
      );
    }

    const characters = stores.filter((s) => !s.isVault);

    const activities = this.init(characters as D1Store[], defs);

    return (
      <div className="activities dim-page">
        <div className="activities-characters">
          {characters.map((store) => (
            <div key={store.id} className="activities-character">
              <SimpleCharacterTile character={store} />
            </div>
          ))}
        </div>

        {activities.map((activity) => (
          <div key={activity.hash} className="activity section">
            <CollapsibleTitle
              style={bungieBackgroundStyle(activity.image)}
              className={classNames('title activity-header', {
                'activity-featured': activity.featured
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
                          {character.steps.map((step, index) => (
                            <span
                              key={index}
                              className={classNames('step-icon', { complete: step.complete })}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {activity.skulls &&
                  activity.skulls.map((skull) => (
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

  // TODO: Ideally there would be an Advisors service that would
  // lazily load advisor info, and we'd get that info
  // here. Unfortunately we're also using advisor info to populate
  // extra info in Trials cards in Store service, and it's more
  // efficient to just fish the info out of there.

  private init = (stores: D1Store[], defs: D1ManifestDefinitions) => {
    const whitelist = [
      'vaultofglass',
      'crota',
      'kingsfall',
      'wrathofthemachine',
      // 'elderchallenge',
      'nightfall',
      'heroicstrike'
    ];

    const rawActivities = Object.values(stores[0].advisors.activities).filter(
      (a: any) => a.activityTiers && whitelist.includes(a.identifier)
    );
    const activities = _.sortBy(rawActivities, (a: any) => {
      const ix = whitelist.indexOf(a.identifier);
      return ix === -1 ? 999 : ix;
    }).map((a) => this.processActivities(defs, stores, a));

    activities.forEach((a) => {
      a.tiers.forEach((t) => {
        if (t.hash === stores[0].advisors.activities.weeklyfeaturedraid.display.activityHash) {
          a.featured = true;
          t.name = t.hash === 1387993552 ? '390' : t.name;
        }
      });
    });

    return activities;
  };

  private processActivities = (
    defs: D1ManifestDefinitions,
    stores: D1Store[],
    rawActivity
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
      tiers: [] as ActivityTier[]
    };

    if (rawActivity.extended) {
      activity.skulls = rawActivity.extended.skullCategories.map((s) => {
        return s.skulls;
      });
    }

    const rawSkullCategories = rawActivity.activityTiers[0].skullCategories;
    if (rawSkullCategories && rawSkullCategories.length) {
      activity.skulls = rawSkullCategories[0].skulls;
    }

    if (activity.skulls) {
      activity.skulls = i18nActivitySkulls(activity.skulls, defs);
    }

    // flatten modifiers and bonuses for now.
    if (activity.skulls) {
      activity.skulls = _.flatten(activity.skulls);
    }

    activity.tiers = rawActivity.activityTiers.map((r, i) =>
      this.processActivity(defs, rawActivity.identifier, stores, r, i)
    );

    return activity;
  };

  private processActivity = (
    defs: D1ManifestDefinitions,
    activityId: string,
    stores: D1Store[],
    tier: any,
    index: number
  ): ActivityTier => {
    const tierDef = defs.Activity.get(tier.activityHash);

    const name =
      tier.activityData.recommendedLight === 390
        ? 390
        : tier.tierDisplayName
        ? t(`Activities.${tier.tierDisplayName}`)
        : tierDef.activityName;

    const characters =
      activityId === 'heroicstrike'
        ? []
        : stores.map((store) => {
            let steps = store.advisors.activities[activityId].activityTiers[index].steps;

            if (!steps) {
              steps = [store.advisors.activities[activityId].activityTiers[index].completion];
            }

            return {
              name: store.name,
              lastPlayed: store.lastPlayed,
              id: store.id,
              icon: store.icon,
              steps
            };
          });

    return {
      hash: tierDef.activityHash,
      icon: tierDef.icon,
      name,
      complete: tier.activityData.isCompleted,
      characters
    };
  };
}

function i18nActivitySkulls(skulls, defs: D1ManifestDefinitions): Skull[] {
  const skullHashesByName = {
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
    Epic: 20
  };

  const activity = {
    heroic: defs.Activity.get(870614351),
    epic: defs.Activity.get(2234107290)
  };

  for (const skull of skulls[0]) {
    const hash = skullHashesByName[skull.displayName];
    if (hash === 20) {
      skull.displayName = activity.epic.skulls[0].displayName;
      skull.description = activity.epic.skulls[0].description;
    } else if (activity.heroic.skulls[hash]) {
      skull.displayName = activity.heroic.skulls[hash].displayName;
      skull.description = activity.heroic.skulls[hash].description;
    }
  }
  return skulls;
}

export default connect<StoreProps>(mapStateToProps)(Activities);
