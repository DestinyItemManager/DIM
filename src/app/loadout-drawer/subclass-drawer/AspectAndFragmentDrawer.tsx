import { languageSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import PlugDrawer from 'app/loadout/plug-drawer/PlugDrawer';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { SDDispatch } from './reducer';
import { SelectedPlugs, SocketWithOptions } from './types';

const MAX_ASPECTS = 2;

export default function AspectAndFragmentDrawer({
  aspects,
  fragments,
  selectedPlugs,
  dispatch,
  onClose,
}: {
  aspects: SocketWithOptions[];
  fragments: SocketWithOptions[];
  selectedPlugs: SelectedPlugs;
  dispatch: SDDispatch;
  onClose(): void;
}) {
  const language = useSelector(languageSelector);

  const { initiallySelected, plugs, aspectPlugs } = useMemo(() => {
    const { selected: initiallySelectedAspects, plugs: aspectPlugs } = getPlugsAndSelected(
      aspects,
      selectedPlugs
    );

    const { selected: initiallySelectedFragments, plugs: fragmentPlugs } = getPlugsAndSelected(
      fragments,
      selectedPlugs
    );

    return {
      initiallySelected: [...initiallySelectedAspects, ...initiallySelectedFragments],
      plugs: [...aspectPlugs, ...fragmentPlugs],
      aspectPlugs,
    };
  }, [aspects, fragments, selectedPlugs]);

  const onAccept = useCallback(
    (selected: PluggableInventoryItemDefinition[]) => {
      const groupedPlugs = _.groupBy(selected, (plug) => plug.plug.plugCategoryHash);
      const newPlugs = { ...selectedPlugs };

      for (const plugCategoryHash of Object.keys(groupedPlugs)) {
        if (plugCategoryHash) {
          newPlugs[plugCategoryHash] = groupedPlugs[plugCategoryHash];
        }
      }
      dispatch({ type: 'update-plugs', selectedPlugs: newPlugs });
    },
    [dispatch, selectedPlugs]
  );

  // Determines whether an aspect of fragment is currently selectable
  // - Both: only a single instace can be selected at a time
  // - Fragments: the energy level of the aspects determines the number that can be selected
  // - Aspects: A maximum of 2 can be selected.
  const isPlugSelectable = useCallback(
    (plug: PluggableInventoryItemDefinition, selected: PluggableInventoryItemDefinition[]) => {
      const selectedAspects = selected.filter(
        (s) => s.plug.plugCategoryHash !== plug.plug.plugCategoryHash
      );

      if (aspectPlugs.some((aspect) => aspect.hash === plug.hash)) {
        const isSelected = selectedAspects.some((s) => s.hash === plug.hash);
        return !isSelected && selectedAspects.length < MAX_ASPECTS;
      } else {
        const selectedFragments = selected.filter(
          (s) => s.plug.plugCategoryHash === plug.plug.plugCategoryHash
        );
        const maximumFragments = _.sumBy(
          selectedAspects,
          (aspect) => aspect.plug.energyCapacity?.capacityValue || 0
        );
        const isSelected = selectedFragments.some((s) => s.hash === plug.hash);

        return !isSelected && selectedFragments.length < maximumFragments;
      }
    },
    [aspectPlugs]
  );

  return (
    <PlugDrawer
      title={t('Loadouts.AspectsAndFragments')}
      searchPlaceholder={t('Loadouts.SearchAspectsAndFragments')}
      acceptButtonText={t('Loadouts.Apply')}
      language={language}
      plugs={plugs}
      onAccept={onAccept}
      onClose={onClose}
      isPlugSelectable={isPlugSelectable}
      initiallySelected={initiallySelected}
    />
  );
}

/**
 * This gets the usable and selected aspects or fragments for the PlugDrawer.
 *
 * It removes the empty socket plug from results and figures out the selected plugs for the passed
 * in socket.
 */
function getPlugsAndSelected(
  socketWithOptionsList: SocketWithOptions[],
  selectedPlugs: SelectedPlugs
) {
  const first = (socketWithOptionsList.length && socketWithOptionsList[0]) || undefined;
  const emptySockets = _.compact(
    socketWithOptionsList.map(({ socket, options }) =>
      options.find((option) => option.hash === socket.socketDefinition.singleInitialItemHash)
    )
  );
  const empty = emptySockets.length ? emptySockets[0] : undefined;

  const plugs =
    first?.options.filter(
      (plug): plug is PluggableInventoryItemDefinition =>
        empty?.hash !== plug.hash && isPluggableItem(plug)
    ) || [];

  const plugCategoryHash = first?.options.length
    ? first.options[0].plug?.plugCategoryHash
    : undefined;

  const selected =
    (plugCategoryHash !== undefined &&
      selectedPlugs[plugCategoryHash]?.filter(
        (plug) => empty?.hash !== plug.hash && isPluggableItem(plug)
      )) ||
    [];

  return { plugs, selected };
}
