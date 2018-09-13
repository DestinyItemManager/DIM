export default function showRatings(item) {
  return (
    item.dtrRating &&
    item.dtrRating.overallScore &&
    (item.dtrRating.ratingCount > (item.destinyVersion === 2 ? 0 : 1) ||
      item.dtrRating.highlightedRatingCount > 0)
  );
}
