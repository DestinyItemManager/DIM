import { DestinyAccount } from 'app/accounts/destiny-account';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { usePageTitle } from 'app/utils/hooks';
import { useLocation, useParams } from 'react-router';
import Armory from './LazyArmory';

export default function ArmoryPage({ account }: { account: DestinyAccount }) {
  usePageTitle(t('Armory.Armory'));
  const { itemHash: itemHashString } = useParams();
  const itemHash = parseInt(itemHashString ?? '', 10);
  const { search } = useLocation();
  const storesLoaded = useLoadStores(account);
  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  const searchParams = new URLSearchParams(search);
  const perksString = searchParams.get('perks') ?? '';
  const sockets = perksString.split(',').reduce<{ [index: number]: number }>((memo, n, i) => {
    const perkHash = parseInt(n, 10);
    if (perkHash !== 0) {
      memo[i] = perkHash;
    }
    return memo;
  }, {});

  return (
    <div className="dim-page">
      <Armory key={itemHash} itemHash={itemHash} realItemSockets={sockets} />
    </div>
  );
}
