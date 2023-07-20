import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { InGameLoadoutIconFromIdentifiers } from './InGameLoadoutIcon';

export default function InGameLoadoutIconSelectButton({ loadout }: { loadout: Loadout }) {
  const identifiers = loadout.parameters?.inGameIdentifiers;

  let content = <div>Noooo</div>;

  if (identifiers) {
    content = <InGameLoadoutIconFromIdentifiers identifiers={identifiers} />;
  }

  return <ClosableContainer onClose={() => console.log('close')}>{content}</ClosableContainer>;
}
