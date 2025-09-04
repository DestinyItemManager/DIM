import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { D2SeasonPassActiveList } from 'data/d2/d2-season-info';

export function getCurrentSeasonInfo(
  defs: D2ManifestDefinitions,
  profileInfo: DestinyProfileResponse,
) {
  const season = profileInfo.profile?.data?.currentSeasonHash
    ? defs.Season.get(profileInfo.profile.data.currentSeasonHash)
    : undefined;
  const seasonPass = season?.seasonPassList[D2SeasonPassActiveList]?.seasonPassHash
    ? defs.SeasonPass.get(season.seasonPassList[D2SeasonPassActiveList].seasonPassHash)
    : undefined;
  return { season, seasonPass };
}
