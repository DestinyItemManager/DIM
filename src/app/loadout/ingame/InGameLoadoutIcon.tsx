import BungieImage, { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';

export default function InGameLoadoutIcon({
  loadout,
  className,
}: {
  loadout: InGameLoadout;
  className?: string;
}) {
  return (
    <BungieImage
      className={className}
      style={bungieBackgroundStyle(loadout.colorIcon)}
      src={loadout.icon}
      height={32}
      width={32}
    />
  );
}
