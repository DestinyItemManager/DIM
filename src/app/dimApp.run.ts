import { SyncService } from './storage/sync.service';
import { initSettings } from './settings/settings';

export default function run() {
  'ngInject';

  SyncService.init();
  initSettings();

  console.log(
    `DIM v${$DIM_VERSION} (${$DIM_FLAVOR}) - Please report any errors to https://www.github.com/DestinyItemManager/DIM/issues`
  );
}
