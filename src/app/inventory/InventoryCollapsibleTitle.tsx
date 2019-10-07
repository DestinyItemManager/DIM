import React from 'react';
import { RootState } from '../store/reducers';
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
    collapsed: state.settings.collapsedSections[props.sectionId]
  };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: ProvidedProps): DispatchProps {
  return {
    toggle: () => {
      dispatch(toggleCollapsedSection(ownProps.sectionId));
    }
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
  stores
}: Props) {
  const checkPostmaster = sectionId === 'Postmaster';

  return (
    <>
      <div
        className={clsx('store-row', 'inventory-title', {
          collapsed
        })}
      >
        {stores.map((store, index) => (
          <div
            key={store.id}
            className={clsx('title', 'store-cell', className, {
              collapsed,
              vault: store.isVault,
              postmasterFull: checkPostmaster && store.isDestiny2() && postmasterAlmostFull(store)
            })}
            style={storeBackgroundColor(store, index)}
          >
            {index === 0 ? (
              <span className="collapse-handle" onClick={toggle}>
                <AppIcon className="collapse-icon" icon={collapsed ? expandIcon : collapseIcon} />{' '}
                <span>
                  {checkPostmaster && store.isDestiny2() && postmasterAlmostFull(store)
                    ? t('ItemService.PostmasterAlmostFull', {
                        number: postmasterSpaceUsed(store),
                        postmasterSize: POSTMASTER_SIZE
                      })
                    : title}
                </span>
              </span>
            ) : (
              checkPostmaster &&
              store.isDestiny2() &&
              postmasterAlmostFull(store) &&
              t('ItemService.PostmasterAlmostFull', {
                number: postmasterSpaceUsed(store),
                postmasterSize: POSTMASTER_SIZE
              })
            )}
          </div>
        ))}
      </div>
      {!collapsed && children}
    </>
  );
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(InventoryCollapsibleTitle);
