import { DestinyLinkedProfilesResponse } from 'bungie-api-ts/destiny2';
import 'cross-fetch/polyfill';
import aceProfile from '../../testing/data/ace-accounts.json';
import vidboiProfile from '../../testing/data/vidboi-accounts.json';
import { DestinyAccount, generatePlatforms } from './destiny-account';

async function getCharactersAPI(_account: DestinyAccount) {
  return [{ id: '1231541', dateLastPlayed: new Date(0), base: '' }];
}

const cases = [
  ['ace', aceProfile],
  ['vidboi', vidboiProfile],
];

describe('generatePlatforms', () => {
  test.each(cases)("%s's profile", async (_name, profile) => {
    const platforms = await generatePlatforms(
      profile as unknown as DestinyLinkedProfilesResponse,
      getCharactersAPI
    );
    expect(platforms).toMatchSnapshot();
  });
});
