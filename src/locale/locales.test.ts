import i18next from 'i18next';
import { setupi18n } from 'testing/test-utils';
import { getCopyWithCount } from 'testing/utils/i18next';

setupi18n();

const locales = [
  'en',
  'de',
  'es',
  'es-mx',
  'fr',
  'it',
  'ja',
  'ko',
  'pl',
  'pt-br',
  'ru',
  'zh-chs',
  'zh-cht',
];

const keysWithCounts = [
  'Armory.TrashlistedRolls',
  'Armory.WishlistedRolls',
  'Armory.WishlistedRolls',
  'BulkNote.Title',
  'Countdown.Days',
  'Countdown.Days_compact',
  'Csv.ImportSuccess',
  'FarmingMode.D2Desc',
  'FarmingMode.D2Desc_female',
  'FarmingMode.D2Desc_male',
  'FarmingMode.Desc',
  'FarmingMode.Desc_female',
  'FarmingMode.Desc_male',
  'Filter.BulkClear',
  'Filter.BulkRevert',
  'Filter.BulkTag',
  'Header.FilterMatchCount',
  'Loadouts.ItemErrorSummary',
  'Loadouts.MakeRoomDone_female',
  'Loadouts.MakeRoomDone_male',
  'Loadouts.MakeRoomDone',
  'Loadouts.ModErrorSummary',
  'Loadouts.ModPlacement.InvalidModsDesc',
  'Loadouts.ModPlacement.UnassignedModsDesc',
  'Loadouts.PullFromPostmasterNotification_female',
  'Loadouts.PullFromPostmasterNotification_male',
  'Loadouts.PullFromPostmasterNotification',
  'Loadouts.Share.NumItems',
  'Loadouts.Share.NumMods',
  'Progress.PointsUsed',
  'Progress.Resets',
  'Settings.SpacesSize',
  'Storage.UpdateQueueLength',
  'WishListRoll.BestRatedTip',
  'WishListRoll.WorstRatedTip',
];

describe.each(locales)('locale %s', (locale) => {
  describe.each(keysWithCounts)('i18n key %s', (i18nKey) => {
    describe.each([0, 1, 4, 51])('with count %s', (count) => {
      const t = i18next.getFixedT(locale, 'translation');

      test.each`
        copy                                            | expected
        ${t(i18nKey, { count, defaultValue: i18nKey })} | ${getCopyWithCount(i18nKey, locale, count)}
      `('returns: $copy', ({ copy, expected }) => {
        expect(copy).toStrictEqual(expected);
      });
    });
  });
});
