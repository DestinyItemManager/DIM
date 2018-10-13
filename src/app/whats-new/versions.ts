import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as _ from 'lodash';

const localStorageKey = 'dim-changelog-viewed-version';

/** Information about the user's relationship with DIM versions */
class Versions {
  readonly currentVersion = cleanVersion($DIM_VERSION)!;
  previousVersion = cleanVersion(localStorage.getItem(localStorageKey));

  /** An observable for whether to show the changelog. */
  showChangelog$ = new BehaviorSubject(this.showChangelog);

  /**
   * Signify that the changelog page has been viewed.
   */
  changelogWasViewed() {
    localStorage.setItem(localStorageKey, this.currentVersion);
    this.previousVersion = this.currentVersion;
    this.showChangelog$.next(this.showChangelog);
  }

  versionIsNew(version: string) {
    if (version === 'Next') {
      return false;
    }
    if (this.previousVersion) {
      return compareVersions(version, this.previousVersion) > 0;
    } else {
      return false;
    }
  }

  // TODO: It'd be nice to also check whether the changelog has any entries between versions...
  // TODO: it'd be good to store this in settings, so you sync the last version you've seen
  private get showChangelog() {
    // Don't highlight the changelog if this is their first time using DIM.
    // This also helps with folks who lose their storage.
    if (this.previousVersion === null) {
      return false;
    }
    return this.currentVersion !== this.previousVersion;
  }
}

// Clean out Beta versions to ignore their build number.
function cleanVersion(version: string | null) {
  if (version) {
    return _.take(version.split('.'), 3).join('.');
  }
  return version;
}

function splitVersion(version: string): number[] {
  return version.split('.').map((s) => parseInt(s, 10));
}

export function compareVersions(version1: string, version2: string) {
  const v1 = splitVersion(version1);
  const v2 = splitVersion(version2);

  for (let i = 0; i < 3; i++) {
    if ((v1[i] || 0) > (v2[i] || 0)) {
      return 1;
    } else if ((v1[i] || 0) < (v2[i] || 0)) {
      return -1;
    }
  }

  return 0;
}

export const DimVersions = new Versions();
