import { DestinyComponentType } from 'bungie-api-ts/destiny2';
import { buildURLFromConfig } from './bungie-service-helper';

test('asdf ', () => {
  const built = buildURLFromConfig({
    method: 'GET',
    url: '',
    params: {
      characterId: '123',
      destinyMembershipId: '123',
      membershipType: '4',
      components: [
        DestinyComponentType.Vendors,
        DestinyComponentType.VendorSales,
        DestinyComponentType.ItemInstances,
        DestinyComponentType.ItemObjectives,
        DestinyComponentType.ItemStats,
        DestinyComponentType.ItemSockets,
        DestinyComponentType.ItemTalentGrids,
        DestinyComponentType.ItemCommonData,
        DestinyComponentType.CurrencyLookups,
        DestinyComponentType.ItemPlugStates,
        DestinyComponentType.ItemReusablePlugs,
        // TODO: We should try to defer this until the popup is open!
        DestinyComponentType.ItemPlugObjectives,
      ],
      vendorHash: 12341234,
    },
  });
  expect(built).toMatchInlineSnapshot(`
    <img
      class="no-pointer-events"
      loading="lazy"
      src="https://www.bungie.net/foo.jpg"
    />
  `);
});
