import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
export interface ManifestDefinitions {
  /** Check if these defs are from D1. Inside an if statement, these defs will be narrowed to type D1ManifestDefinitions. */
  isDestiny1(): this is D1ManifestDefinitions;
  /** Check if these defs are from D2. Inside an if statement, these defs will be narrowed to type D2ManifestDefinitions. */
  isDestiny2(): this is D2ManifestDefinitions;
}
