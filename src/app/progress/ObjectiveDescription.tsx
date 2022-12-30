import { D1ObjectiveDefinition } from 'app/destiny1/d1-manifest-types';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { DestinyObjectiveDefinition } from 'bungie-api-ts/destiny2';
import BungieImage from '../dim-ui/BungieImage';

export default function ObjectiveDescription({
  progressDescription,
  objectiveDef,
}: {
  progressDescription: string;
  objectiveDef?: DestinyObjectiveDefinition | D1ObjectiveDefinition;
}) {
  const icon =
    objectiveDef && 'displayProperties' in objectiveDef && objectiveDef.displayProperties.hasIcon
      ? objectiveDef.displayProperties.icon
      : undefined;

  return (
    <div className="objective-description">
      {icon && <BungieImage src={icon} />}
      <RichDestinyText text={progressDescription} />
    </div>
  );
}
