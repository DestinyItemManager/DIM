import { tl } from 'app/i18next-t';
import { getRating, shouldShowRating } from 'app/item-review/reducer';
import { FilterDefinition } from '../filter-types';
import { rangeStringToComparator } from './range-numeric';

const ratingsFilters: FilterDefinition[] = [
  {
    keywords: 'rating',
    description: tl('Filter.Rating'),
    format: 'range',
    filterFunction: ({ filterValue, ratings }) => {
      const compareTo = rangeStringToComparator(filterValue);
      return (item) => {
        const dtrRating = getRating(item, ratings);
        const showRating = dtrRating && shouldShowRating(dtrRating) && dtrRating.overallScore;
        return (
          Boolean(showRating) &&
          dtrRating?.overallScore !== undefined &&
          compareTo(dtrRating?.overallScore)
        );
      };
    },
  },
  {
    keywords: 'ratingcount',
    description: tl('Filter.RatingCount'),
    format: 'range',
    filterFunction: ({ filterValue, ratings }) => {
      const compareTo = rangeStringToComparator(filterValue);
      return (item) => {
        const dtrRating = getRating(item, ratings);
        return dtrRating?.ratingCount !== undefined && compareTo(dtrRating?.overallScore);
      };
    },
  },
  {
    keywords: ['rated', 'hasrating'],
    description: tl('Filter.HasRating'),
    filterFunction: ({ ratings }) => (item) => {
      const dtrRating = getRating(item, ratings);
      return dtrRating?.overallScore !== undefined;
    },
  },
];

export default ratingsFilters;
