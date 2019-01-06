/**
 * The D1/D2 API returns an almost-ISO 8601 UTC datetime. This gets us over the hump.
 * http://jasonwatmore.com/post/2016/03/31/angularjs-utc-to-local-date-time-filter
 */
export function toUtcTime(utcDateString: string): Date {
  // right meow unless they tell us otherwise
  if (!utcDateString) {
    return new Date();
  }

  // append 'Z' to the date string to indicate UTC time if the timezone isn't already specified
  if (utcDateString.indexOf('Z') === -1 && utcDateString.indexOf('+') === -1) {
    utcDateString += 'Z';
  }

  return new Date(utcDateString);
}
