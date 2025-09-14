import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { currentSeasonPassHashSelector } from 'app/manifest/selectors';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { useSelector } from 'react-redux';

export function useCurrentSeasonInfo(
  defs: D2ManifestDefinitions,
  profileInfo: DestinyProfileResponse | undefined,
) {
  const currentSeasonPassHash = useSelector(currentSeasonPassHashSelector);

  if (!defs || !profileInfo) {
    return { season: undefined, seasonPass: undefined, seasonPassStartEnd: undefined };
  }

  const season = profileInfo.profile?.data?.currentSeasonHash
    ? defs.Season.get(profileInfo.profile.data.currentSeasonHash)
    : undefined;
  const seasonPass = currentSeasonPassHash ? defs.SeasonPass.get(currentSeasonPassHash) : undefined;
  return {
    season,
    seasonPass,
    seasonPassStartEnd: season?.seasonPassList.find(
      (s) => s.seasonPassHash === currentSeasonPassHash,
    ),
  };
}
