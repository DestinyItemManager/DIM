import { DestinyActivity, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { getLiveRotatingDungeonHashes } from './Dungeons';
import { EQUILIBRIUM_ACTIVITY_HASH } from './dungeon-rotation';

const DUALITY = 2823159265;
const VESPERS_HOST = 300092127;
const SUNDERED_DOCTRINE = 3834447244;

function activity(activityHash: number, hasChallenge: boolean): DestinyActivity {
  return {
    activityHash,
    challenges: hasChallenge
      ? [
          {
            objective: {
              visible: true,
            },
          },
        ]
      : [],
  } as DestinyActivity;
}

describe('dungeons', () => {
  it('finds live rotating dungeon challenges across all characters', () => {
    const profileInfo = {
      characterActivities: {
        data: {
          firstCharacter: {
            availableActivities: [
              activity(DUALITY, true),
              activity(EQUILIBRIUM_ACTIVITY_HASH, true),
            ],
          },
          secondCharacter: {
            availableActivities: [activity(VESPERS_HOST, true), activity(SUNDERED_DOCTRINE, false)],
          },
        },
      },
    } as unknown as DestinyProfileResponse;

    expect(getLiveRotatingDungeonHashes(profileInfo)).toEqual([DUALITY, VESPERS_HOST]);
  });
});
