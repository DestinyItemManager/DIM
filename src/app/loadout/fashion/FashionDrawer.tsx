import BungieImage from 'app/dim-ui/BungieImage';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { LockableBucketHashes } from 'app/loadout-builder/types';
import { DimLoadoutItem, Loadout } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { DEFAULT_ORNAMENTS, DEFAULT_SHADER } from 'app/search/d2-known-values';
import _ from 'lodash';
import React from 'react';
import styles from './FashionDrawer.m.scss';

/** An editor for "Fashion" (shaders and ornaments) in a loadout */
export default function FashionDrawer({
  loadout,
  items,
  onClose,
}: {
  loadout: Loadout;
  items: DimLoadoutItem[];
  onClose: () => void;
}) {
  const defs = useD2Definitions()!;
  const defaultShaderPlug = defs.InventoryItem.get(DEFAULT_SHADER);
  const defaultOrnamentPlug = defs.InventoryItem.get(DEFAULT_ORNAMENTS[0]);

  const armorItemsByBucketHash = _.mapValues(
    _.groupBy(
      items.filter((i) => i.equipped && LockableBucketHashes.includes(i.bucket.hash)),
      (i) => i.bucket.hash
    ),
    (items) => items[0]
  );

  // TODO: categorize by shader, ornament
  const modsByBucket = loadout.parameters?.modsByBucket ?? {};

  // TODO: if they add an armor piece that can't slot the selected mods (ornaments), clear them
  // TODO: pick mods based on what's unlocked (ModPicker may not be correct? SocketDetails?)
  // TODO: fill out fashion when adding equipped?
  // TODO: fill out fashion when choosing items? probably not
  // TODO: Add a "disabled" prop to sheets that greys them out (and maybe scales down?) and disables their buttons + esc (block input) so we don't need to match heights
  // TODO: reset/clear all from top level
  // TODO: footer with an accept/cancel button? Put the other buttons there?

  console.log(modsByBucket);

  const header = (
    <>
      <h1>{t('FashionDrawer.Title')}</h1>
    </>
  );

  const footer = (
    <>
      <button type="button" className="dim-button">
        Apply Fashion
      </button>
      <button type="button" className="dim-button">
        Reset all
      </button>
      <button type="button" className="dim-button">
        Use currently equipped ornaments/shaders
      </button>
      <button type="button" className="dim-button">
        Sync Shader
      </button>
      <button type="button" className="dim-button">
        Sync Ornament Set
      </button>
    </>
  );

  return (
    <Sheet onClose={onClose} header={header} footer={footer} sheetClassName={styles.sheet}>
      <div className={styles.items}>
        {LockableBucketHashes.map((bucketHash) => (
          <div key={bucketHash} className={styles.item}>
            {armorItemsByBucketHash[bucketHash] ? (
              <ConnectedInventoryItem item={armorItemsByBucketHash[bucketHash]} />
            ) : (
              <div className={styles.placeholder}>Placeholder</div>
            )}
            <div className={styles.socket}>
              <BungieImage src={defaultOrnamentPlug.displayProperties.icon} />
            </div>
            <div className={styles.socket}>
              <BungieImage src={defaultShaderPlug.displayProperties.icon} />
            </div>
          </div>
        ))}
      </div>

      {pickPlug && (
        <PlugDrawer
          title={t('LB.ChooseAMod')}
          searchPlaceholder={t('LB.SearchAMod')}
          acceptButtonText={t('LB.SelectMods')}
          language={language}
          initialQuery={initialQuery}
          plugSets={plugSets}
          initiallySelected={visibleSelectedMods}
          minHeight={minHeight}
          isPlugSelectable={isModSelectable}
          sortPlugGroups={sortModPickerPlugGroups}
          sortPlugs={sortMods}
          onAccept={onAcceptWithHiddenSelectedMods}
          onClose={onClose}
        />
      )}
    </Sheet>
  );
}
