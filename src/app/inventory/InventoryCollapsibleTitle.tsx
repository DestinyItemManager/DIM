import React from 'react';
import { RootState } from 'app/store/types';
import { connect } from 'react-redux';
import { toggleCollapsedSection } from '../settings/actions';
import { Dispatch } from 'redux';
import { AppIcon, expandIcon, collapseIcon } from '../shell/icons';
import clsx from 'clsx';
import '../dim-ui/CollapsibleTitle.scss';
import './InventoryCollapsibleTitle.scss';
import { DimStore } from './store-types';
import { storeBackgroundColor } from '../shell/filters';
import { t } from 'app/i18next-t';
import { postmasterAlmostFull, POSTMASTER_SIZE, postmasterSpaceUsed } from 'app/loadout/postmaster';
import { settingsSelector } from 'app/settings/reducer';

interface ProvidedProps {
  sectionId: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  stores: DimStore[];
}

interface StoreProps {
  collapsed: boolean;
}

interface DispatchProps {
  toggle(): void;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return {
    collapsed: settingsSelector(state).collapsedSections[props.sectionId],
  };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: ProvidedProps): DispatchProps {
  return {
    toggle: () => {
      dispatch(toggleCollapsedSection(ownProps.sectionId));
    },
  };
}

type Props = StoreProps & ProvidedProps & DispatchProps;

function InventoryCollapsibleTitle({
  sectionId,
  title,
  collapsed,
  children,
  toggle,
  className,
  stores,
}: Props) {
  const checkPostmaster = sectionId === 'Postmaster';

  return (
    <>
      <div
        className={clsx('store-row', 'inventory-title', {
          collapsed,
        })}
      >
        {stores.map((store, index) => {
          const storeIsDestiny2 = store.isDestiny2();
          const isPostmasterAlmostFull = postmasterAlmostFull(store);
          const postMasterSpaceUsed = postmasterSpaceUsed(store);
          const showPostmasterFull = checkPostmaster && storeIsDestiny2 && isPostmasterAlmostFull;

          const data = {
            number: postMasterSpaceUsed,
            postmasterSize: POSTMASTER_SIZE,
          };

          const text =
            postMasterSpaceUsed < POSTMASTER_SIZE
              ? t('ItemService.PostmasterAlmostFull', data)
              : t('ItemService.PostmasterFull', data);

          return (
            <div
              key={store.id}
              className={clsx('title', 'store-cell', className, {
                collapsed,
                vault: store.isVault,
                postmasterFull: showPostmasterFull,
              })}
              style={storeBackgroundColor(store, index)}
            >
              {index === 0 ? (
                <span className="collapse-handle" onClick={toggle}>
                  <AppIcon className="collapse-icon" icon={collapsed ? expandIcon : collapseIcon} />{' '}
                  <span>{showPostmasterFull ? text : title}</span>
                </span>
              ) : (
                showPostmasterFull && text
              )}
            </div>
          );
        })}
      </div>
      {!collapsed && children}
    </>
  );
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(InventoryCollapsibleTitle);
