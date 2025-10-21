import ClarityDescriptions from 'app/clarity/descriptions/ClarityDescriptions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import { canInsertPlug, insertPlug } from 'app/inventory/advanced-write-actions';
import {
  DimItem,
  DimPlug,
  DimSocket,
  DimStat,
  PluggableInventoryItemDefinition,
} from 'app/inventory/item-types';
import { interpolateStatValue } from 'app/inventory/store/stats';
import {
  isPlugStatActive,
  mapAndFilterInvestmentStats,
} from 'app/inventory/store/stats-conditional';
import { destiny2CoreSettingsSelector, useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { DEFAULT_ORNAMENTS } from 'app/search/d2-known-values';
import { refreshIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { filterMap } from 'app/utils/collections';
import { errorMessage } from 'app/utils/errors';
import { usePlugDescriptions } from 'app/utils/plug-descriptions';
import { DestinyItemSocketEntryDefinition } from 'bungie-api-ts/destiny2';
import {
  PlugCategoryHashes,
  SocketCategoryHashes,
  StatHashes,
  TraitHashes,
} from 'data/d2/generated-enums';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ItemStats from './ItemStats';
import { PlugStats } from './PlugTooltip';
import { SocketDetailsMod } from './SocketDetails';
import * as styles from './SocketDetailsSelectedPlug.m.scss';

const costStatHashes = [
  StatHashes.AnyEnergyTypeCost,
  StatHashes.VoidCost,
  StatHashes.SolarCost,
  StatHashes.ArcCost,
];

const whitelistPlugCategoryToLocKey = {
  [PlugCategoryHashes.Shader]: 'Shader',
  [PlugCategoryHashes.ShipSpawnfx]: 'Transmat',
  [PlugCategoryHashes.Hologram]: 'Projection',
} as const;

const socketCategoryToLocKey = {
  [SocketCategoryHashes.Super]: 'Super',
  [SocketCategoryHashes.Abilities_Abilities]: 'Ability',
  [SocketCategoryHashes.Abilities_Abilities_Ikora]: 'Ability',
  [SocketCategoryHashes.Aspects_Abilities_Ikora]: 'Aspect',
  [SocketCategoryHashes.Aspects_Abilities_Neomuna]: 'Aspect',
  [SocketCategoryHashes.Aspects_Abilities_Stranger]: 'Aspect',
  [SocketCategoryHashes.Fragments_Abilities_Ikora]: 'Fragment',
  [SocketCategoryHashes.Fragments_Abilities_Neomuna]: 'Fragment',
  [SocketCategoryHashes.Fragments_Abilities_Stranger]: 'Fragment',
} as const;

/**
 * Figures out what kind of socket this is so that the "Apply" button can name
 * the correct thing instead of generically saying "Select/Insert Mod". Note
 * that these are used as part of the localization key. We're using keyof typeof
 * here so that we automatically type the return value to the possible
 * localization keys.
 */
function uiCategorizeSocket(defs: D2ManifestDefinitions, socket: DestinyItemSocketEntryDefinition) {
  const socketTypeDef = socket.socketTypeHash && defs.SocketType.get(socket.socketTypeHash);
  if (socketTypeDef) {
    const socketCategoryHash =
      socketTypeDef.socketCategoryHash as keyof typeof socketCategoryToLocKey;
    if (socketCategoryToLocKey[socketCategoryHash]) {
      return socketCategoryToLocKey[socketCategoryHash];
    } else {
      const plug = socketTypeDef.plugWhitelist.find(
        (p) =>
          whitelistPlugCategoryToLocKey[
            p.categoryHash as keyof typeof whitelistPlugCategoryToLocKey
          ],
      );
      if (plug) {
        return whitelistPlugCategoryToLocKey[
          plug.categoryHash as keyof typeof whitelistPlugCategoryToLocKey
        ];
      }
    }
  }

  const initialPlugHash = socket.singleInitialItemHash;
  if (initialPlugHash && DEFAULT_ORNAMENTS.includes(initialPlugHash)) {
    return 'Ornament';
  }

  return 'Mod';
}

export default function SocketDetailsSelectedPlug({
  plug,
  socket,
  item,
  currentPlug,
  equippable,
  allowInsertPlug,
  closeMenu,
  onPlugSelected,
}: {
  plug: PluggableInventoryItemDefinition;
  socket: DimSocket;
  item: DimItem;
  currentPlug: DimPlug | null;
  equippable: boolean;
  allowInsertPlug: boolean;
  closeMenu: () => void;
  /** If this is set, instead of offering to slot the mod, we just notify above */
  onPlugSelected?: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
}) {
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions()!;
  const destiny2CoreSettings = useSelector(destiny2CoreSettingsSelector)!;

  const materialRequirementSet =
    (plug.plug.insertionMaterialRequirementHash &&
      defs.MaterialRequirementSet.get(plug.plug.insertionMaterialRequirementHash)) ||
    undefined;

  const sourceString = plug.collectibleHash
    ? defs.Collectible.get(plug.collectibleHash)?.sourceString
    : undefined;

  const stats = filterMap(mapAndFilterInvestmentStats(plug), (stat) => {
    if (costStatHashes.includes(stat.statTypeHash)) {
      return undefined;
    }
    const itemStat = item.stats?.find((s) => s.statHash === stat.statTypeHash);
    if (!itemStat) {
      return undefined;
    }

    if (!isPlugStatActive(stat.activationRule, { item, existingStat: itemStat })) {
      return undefined;
    }

    const statGroupDef = defs.StatGroup.get(
      defs.InventoryItem.get(item.hash).stats!.statGroupHash!,
    );

    const statDisplay = statGroupDef?.scaledStats.find((s) => s.statHash === stat.statTypeHash);
    const currentModValue = currentPlug?.stats?.[stat.statTypeHash]?.investmentValue ?? 0;

    let modValue = stat.value;
    const updatedInvestmentValue = itemStat.investmentValue + modValue - currentModValue;
    let itemStatValue = updatedInvestmentValue;

    if (statDisplay) {
      itemStatValue = interpolateStatValue(updatedInvestmentValue, statDisplay);
      modValue =
        itemStatValue - interpolateStatValue(updatedInvestmentValue - modValue, statDisplay);
    }

    return {
      modValue,
      dimStat: {
        ...itemStat,
        value: itemStatValue,
      } as DimStat,
    };
  });

  // Can we actually insert this mod instead of just previewing it?
  const canDoAWA =
    allowInsertPlug &&
    item.instanced &&
    canInsertPlug(socket, plug.hash, destiny2CoreSettings, defs);

  const kind = uiCategorizeSocket(defs, socket.socketDefinition);
  const insertName = canDoAWA
    ? t(`Sockets.Insert.${kind}`, { metadata: { keys: 'sockets' } })
    : t(`Sockets.Select.${kind}`, { metadata: { keys: 'sockets' } });

  const [insertInProgress, setInsertInProgress] = useState(false);

  // TODO: Push the insertPlug stuff all the way up and out of SocketDetails
  const onInsertPlug = async () => {
    if (canDoAWA) {
      setInsertInProgress(true);
      try {
        await dispatch(insertPlug(item, socket, plug.hash));
        closeMenu();
      } catch (e) {
        const plugName = plug.displayProperties.name ?? 'Unknown Plug';
        showNotification({
          type: 'error',
          title: t('AWA.Error'),
          body: t('AWA.ErrorMessage', { error: errorMessage(e), item: item.name, plug: plugName }),
        });
      } finally {
        setInsertInProgress(false);
      }
    } else {
      onPlugSelected?.({ item, socket, plugHash: plug.hash });
      closeMenu();
    }
  };

  const costs = materialRequirementSet?.materials.map((material) => {
    const materialDef = defs.InventoryItem.get(material.itemHash);
    return (
      materialDef &&
      material.count > 0 &&
      !material.omitFromRequirements && (
        <div className={styles.material} key={material.itemHash}>
          {material.count.toLocaleString()}
          <BungieImage
            className="dontInvert"
            src={materialDef.displayProperties.icon}
            title={materialDef.displayProperties.name}
          />
        </div>
      )
    );
  });

  const plugDescriptions = usePlugDescriptions(
    plug,
    stats.map((stat) => ({ value: stat.modValue, statHash: stat.dimStat.statHash })),
  );

  // Only show Exotic catalyst requirements if the catalyst is incomplete. We assume
  // that an Exotic weapon can only be masterworked if its catalyst is complete.
  const hideRequirements =
    plug.traitHashes?.includes(TraitHashes.ItemExoticCatalyst) && item.masterwork;

  const showPerks = (
    [
      // Include plug hashes here that should show their perks in the socket details.
    ] as PlugCategoryHashes[]
  ).includes(plug.plug.plugCategoryHash);

  return (
    <div className={styles.selectedPlug}>
      <div className={styles.modIcon}>
        <SocketDetailsMod itemDef={plug} />
      </div>

      <h3 className={styles.modName}>
        <span>{plug.displayProperties.name}</span>
        {plug.hash === socket.emptyPlugItemHash && <span> &mdash; {plug.itemTypeDisplayName}</span>}
      </h3>

      <div className={styles.modDescription}>
        {sourceString && <div className={styles.source}>{sourceString}</div>}

        {plugDescriptions.perks.map((perkDesc) => (
          <React.Fragment key={perkDesc.perkHash}>
            {perkDesc.description && !perkDesc.description.includes('▲') && (
              <div>
                <RichDestinyText text={perkDesc.description} />
              </div>
            )}
            {!hideRequirements && perkDesc.requirement && (
              <div className={styles.modRequirement}>
                <RichDestinyText text={perkDesc.requirement} />
              </div>
            )}
          </React.Fragment>
        ))}
        {showPerks &&
          plug.perks.map((perk) => {
            const def = defs.SandboxPerk.get(perk.perkHash);
            if (!def) {
              return null;
            }
            return (
              <div className={styles.perk} key={perk.perkHash}>
                <BungieImage src={def.displayProperties.icon} alt="" />
                <RichDestinyText
                  text={def.displayProperties.name || def.displayProperties.description}
                />
              </div>
            );
          })}
        {stats.length > 0 && (
          <div className={styles.itemStats}>
            <PlugStats
              stats={stats.map((stat) => ({
                statHash: stat.dimStat.statHash,
                value: stat.modValue,
              }))}
            />
            <ItemStats stats={stats.map((s) => s.dimStat)} item={item} />
          </div>
        )}

        {plugDescriptions.communityInsight && (
          <ClarityDescriptions
            perk={plugDescriptions.communityInsight}
            className={styles.modClarityDescription}
          />
        )}
      </div>

      {(canDoAWA || onPlugSelected) && (
        <button
          type="button"
          className={styles.insertButton}
          onClick={onInsertPlug}
          disabled={(canDoAWA && !equippable) || insertInProgress}
        >
          {insertInProgress && (
            <span>
              <AppIcon icon={refreshIcon} spinning={true} />
            </span>
          )}
          <span className={styles.insertLabel}>
            <span>{insertName}</span>
            <span>{costs}</span>
          </span>
        </button>
      )}
    </div>
  );
}
