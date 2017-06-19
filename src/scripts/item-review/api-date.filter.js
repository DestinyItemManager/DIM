function DateFilter() {
  this.utcToLocal = function($filter) {
    return function(utcDateString, format) {
        // return if input date is null or undefined
      if (!utcDateString) {
        return null;
      }

        // append 'Z' to the date string to indicate UTC time if the timezone isn't already specified
      if (utcDateString.indexOf('Z') === -1 && utcDateString.indexOf('+') === -1) {
        utcDateString += 'Z';
      }

        // convert and format date using the built in angularjs date filter
      return $filter('date')(utcDateString, format);
    };
  };
}

export const apiDateFilter = {
  DateFilter: DateFilter
};