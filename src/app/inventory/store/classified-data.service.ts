import * as idbKeyval from 'idb-keyval';
import { settings } from '../../settings/settings';
import { $http } from 'ngimport';
import { IPromise } from 'angular';

let classifiedDataPromise: IPromise<ClassifiedData> | undefined;

export interface ClassifiedData {
  itemHash: {
    [hash: string]: {
      bucketHash: string;
      icon: string;
      classType: number;
      tierType: number;
      primaryBaseStatHash?: number;
      stats?: any;
      i18n: {
        [lang: string]: {
          itemName: string;
          itemDescription: string;
          itemTypeName: string;
        };
      };
    };
  };
  time?: number;
}

/**
 * Load classified data once per load and keep it in memory until
 * reload. Classified data always comes from
 * beta.destinyitemmanager.com so it can be released faster than the
 * release website, but the release website can still use the
 * updated definitions.
 */
export function getClassifiedData(): IPromise<ClassifiedData> {
  if (classifiedDataPromise) {
    return classifiedDataPromise;
  }

  classifiedDataPromise = idbKeyval.get('classified-data').then((data: ClassifiedData) => {
    // Use cached data for up to 4 hours
    if ($DIM_FLAVOR !== 'dev' &&
      data &&
      data.time && data.time > Date.now() - (4 * 60 * 60 * 1000)) {
      return data;
    }

    // In dev, use a local copy of the JSON for testing
    const url = ($DIM_FLAVOR === 'dev')
      ? '/data/classified.json'
      : 'https://beta.destinyitemmanager.com/data/classified.json';

    return $http.get<ClassifiedData>(url)
      .then((response) => {
        if (response && response.status === 200) {
          const remoteData = response.data;
          remoteData.time = Date.now();
          // Don't wait for the set - for some reason this was hanging
          idbKeyval.set('classified-data', remoteData);
          return remoteData;
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

export function buildClassifiedItem(classifiedData: ClassifiedData, hash: string) {
  const info = classifiedData.itemHash[hash];
  if (info) { // do we have declassification info for item?
    const localInfo = info.i18n[settings.language];
    const classifiedItem: any = {
      classified: true,
      icon: info.icon,
      itemName: localInfo.itemName,
      itemDescription: localInfo.itemDescription,
      itemTypeName: localInfo.itemTypeName,
      bucketTypeHash: info.bucketHash,
      tierType: info.tierType,
      classType: info.classType
    };
    if (info.primaryBaseStatHash) {
      classifiedItem.primaryStat = {
        statHash: info.primaryBaseStatHash,
        value: info.stats[info.primaryBaseStatHash].value
      };
    }
    if (info.stats) {
      classifiedItem.stats = info.stats;
    }
    return classifiedItem;
  }
  return null;
}
