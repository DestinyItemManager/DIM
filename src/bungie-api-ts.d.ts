import 'bungie-api-ts/destiny2';
// Extensions/customizations to the generated Bungie.net API types

declare module 'bungie-api-ts/destiny2' {
  const enum DestinyClass {
    /*
     * The class cannot be known because the item is classified.
     * DestinyClass.Unknown really means "not specific to a class", so we invent this
     * value to represent classified items.
     */
    Classified = -1,
  }
}
