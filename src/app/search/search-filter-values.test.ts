import { itemStatAllowList } from 'app/inventory/store/stats';
import { statHashByName } from 'app/search/search-filter-values';
import { invert } from 'app/utils/collections';

it('Should have a search filter for every allowed stat', () => {
  const searchFilterForStat: Record<number, string> = invert(statHashByName);

  for (const stat of itemStatAllowList) {
    expect(searchFilterForStat).toHaveProperty(stat.toString());
  }
});
