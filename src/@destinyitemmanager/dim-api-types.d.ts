import '@destinyitemmanager/dim-api-types';
// Extensions/customizations to the DIM types

declare module '@destinyitemmanager/dim-api-types' {
  export interface LoadoutParameters {
    /** The artifact unlocks relevant to this build. */
    artifactUnlocks?: {
      unlockedItemHashes: number[];
      seasonNumber: number;
    };
  }
}
