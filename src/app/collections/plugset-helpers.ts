import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';

export function itemsForPlugSet(profileResponse: DestinyProfileResponse, plugSetHash: number) {
  return (
    (profileResponse.profilePlugSets.data &&
      profileResponse.profilePlugSets.data.plugs[plugSetHash]) ||
    []
  ).concat(
    Object.values(profileResponse.characterPlugSets.data || {})
      .filter((d) => d.plugs?.[plugSetHash])
      .flatMap((d) => d.plugs[plugSetHash])
  );
}
