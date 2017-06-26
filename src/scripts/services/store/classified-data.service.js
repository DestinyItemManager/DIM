import idbKeyval from 'idb-keyval';

export function ClassifiedDataService($http) {
  'ngInject';

  let classifiedDataPromise;

  return {
    /**
     * Load classified data once per load and keep it in memory until
     * reload. Classified data always comes from
     * beta.destinyitemmanager.com so it can be released faster than the
     * release website, but the release website can still use the
     * updated definitions.
     */
    getClassifiedData() {
      if (classifiedDataPromise) {
        return classifiedDataPromise;
      }

      classifiedDataPromise = idbKeyval.get('classified-data').then((data) => {
        // Use cached data for up to 4 hours
        if ($DIM_FLAVOR !== 'dev' &&
          data &&
          data.time > Date.now() - (4 * 60 * 60 * 1000)) {
          return data;
        }

        // In dev, use a local copy of the JSON for testing
        const url = ($DIM_FLAVOR === 'dev')
          ? '/data/classified.json'
          : 'https://beta.destinyitemmanager.com/data/classified.json';

        return $http.get(url)
          .then((response) => {
            if (response && response.status === 200) {
              const remoteData = response.data;
              remoteData.time = Date.now();
              return idbKeyval.set('classified-data', remoteData).then(() => remoteData);
            }

            console.error(`Couldn't load classified info from ${url}`);

            return {
              itemHash: {}
            };
          })
          .catch((e) => {
            console.error(`Couldn't load classified info from ${url}`, e);

            return {
              itemHash: {}
            };
          });
      });

      return classifiedDataPromise;
    }
  };
}