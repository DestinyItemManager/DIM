import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
export interface ManifestDefinitions {
  /** Check if these defs are from D1. Inside an if statement, these defs will be narrowed to type D1ManifestDefinitions. */
  isDestiny1(): this is D1ManifestDefinitions;
  /** Check if these defs are from D2. Inside an if statement, these defs will be narrowed to type D2ManifestDefinitions. */
  isDestiny2(): this is D2ManifestDefinitions;
}

export class HashLookupFailure extends Error {
  table: string;
  id: number;

  constructor(table: string, id: number) {
    super(`hashLookupFailure: ${table}[${id}]`);
    this.table = table;
    this.id = id;
    this.name = 'HashLookupFailure';
  }
}
