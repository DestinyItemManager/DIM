import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { useD2Definitions } from 'app/manifest/selectors';
import { WELL_RESTED_PERK } from 'app/search/d2-known-values';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import BungieImage from '../dim-ui/BungieImage';
import { isWellRested } from '../inventory/store/well-rested';

export default function WellRestedPerkIcon({
  profileInfo,
}: {
  profileInfo: DestinyProfileResponse;
}) {
  const defs = useD2Definitions()!;
  const wellRestedInfo = isWellRested(defs, profileInfo);

  if (!wellRestedInfo.wellRested) {
    return null;
  }
  const wellRestedPerk = defs.SandboxPerk.get(WELL_RESTED_PERK);
  if (!wellRestedPerk) {
    return null;
  }
  const perkDisplay = wellRestedPerk.displayProperties;
  return (
    <div className="well-rested milestone-quest">
      <div className="milestone-icon">
        <BungieImage
          className="perk milestone-img"
          src={perkDisplay.icon}
          title={perkDisplay.description}
        />
        {wellRestedInfo.weeklyProgress !== undefined && wellRestedInfo.requiredXP !== undefined && (
          <span>
            {wellRestedInfo.weeklyProgress.toLocaleString()}
            <wbr />/<wbr />
            {wellRestedInfo.requiredXP.toLocaleString()}
          </span>
        )}
      </div>
      <div className="milestone-info">
        <span className="milestone-name">{perkDisplay.name}</span>
        <RichDestinyText className="milestone-description" text={perkDisplay.description} />
      </div>
    </div>
  );
}
