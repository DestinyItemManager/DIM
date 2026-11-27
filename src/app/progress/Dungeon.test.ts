import { DUNGEON_ACTIVITY_TYPE_HASH } from 'app/search/d2-known-values';
import {
  DestinyActivity,
  DestinyActivityDefinition,
  DestinyDisplayPropertiesDefinition,
} from 'bungie-api-ts/destiny2';
import { buildDungeonDetails } from './Dungeon';

const DUALITY = 2823159265;
const DUALITY_MASTER = 3012587626;

const dungeonDisplayProperties = {
  name: 'Dungeon',
  description: 'Stats for Dungeons.',
  icon: '/generic-dungeon-icon.png',
  hasIcon: true,
} as DestinyDisplayPropertiesDefinition;

function activityDefinition(hash: number, variant: string): DestinyActivityDefinition {
  return {
    hash,
    activityTypeHash: DUNGEON_ACTIVITY_TYPE_HASH,
    displayProperties: {
      name: `Duality: ${variant}`,
    },
    originalDisplayProperties: {
      name: 'Duality',
    },
    selectionScreenDisplayProperties: {
      name: variant,
    },
  } as DestinyActivityDefinition;
}

function activity(
  activityHash: number,
  {
    challenge = false,
    modifierHashes = [],
  }: {
    challenge?: boolean;
    modifierHashes?: number[];
  } = {},
): DestinyActivity {
  return {
    activityHash,
    isVisible: true,
    canLead: true,
    canJoin: true,
    modifierHashes,
    challenges: challenge
      ? [
          {
            objective: {
              complete: false,
              visible: true,
            },
          },
        ]
      : [],
  } as DestinyActivity;
}

describe('Dungeon', () => {
  it('infers completion from the selected character weekly challenge', () => {
    const definition = activityDefinition(DUALITY, 'Standard');

    const incomplete = buildDungeonDetails(
      DUALITY,
      [activity(DUALITY, { challenge: true })],
      () => definition,
      () => undefined,
      dungeonDisplayProperties,
    );

    const complete = buildDungeonDetails(
      DUALITY,
      [activity(DUALITY)],
      () => definition,
      () => undefined,
      dungeonDisplayProperties,
    );

    expect(incomplete?.complete).toBe(false);
    expect(complete?.complete).toBe(true);
  });

  it('keeps useful difficulty modifiers and suppresses empty variants', () => {
    const definitions = new Map([
      [DUALITY, activityDefinition(DUALITY, 'Standard')],
      [DUALITY_MASTER, activityDefinition(DUALITY_MASTER, 'Master')],
    ]);

    const dungeon = buildDungeonDetails(
      DUALITY,
      [
        activity(DUALITY, {
          challenge: true,
          modifierHashes: [100],
        }),
        activity(DUALITY_MASTER, {
          challenge: true,
          modifierHashes: [100, 200],
        }),
      ],
      (hash) => definitions.get(hash),
      (hash) => (hash === 200 ? 'Master Modifier' : undefined),
      dungeonDisplayProperties,
    );

    expect(dungeon?.variants).toEqual([
      {
        activityHash: DUALITY_MASTER,
        name: 'Master',
        modifierHashes: [200],
      },
    ]);

    expect(dungeon?.displayProperties.name).toBe('Duality');
    expect(dungeon?.displayProperties.icon).toBe('/generic-dungeon-icon.png');
  });
});
