import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { postmasterAlmostFull, postmasterSpaceUsed, POSTMASTER_SIZE } from 'app/loadout/postmaster';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import '../dim-ui/CollapsibleTitle.scss';
import { toggleCollapsedSection } from '../settings/actions';
import { AppIcon, collapseIcon, expandIcon } from '../shell/icons';
import './InventoryCollapsibleTitle.scss';
import { DimStore } from './store-types';

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

  const initialMount = useRef(true);

  useEffect(() => {
    initialMount.current = false;
  }, [initialMount]);

  return (
    <>
      <div
        className={clsx('store-row', 'inventory-title', {
          collapsed,
        })}
      >
        {stores.map((store, index) => {
          const storeIsDestiny2 = store.destinyVersion === 2;
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
                postmaster: checkPostmaster,
              })}
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

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            key="content"
            initial={initialMount.current ? false : 'collapsed'}
            animate="open"
            exit="collapsed"
            variants={{
              open: { height: 'auto' },
              collapsed: { height: 0 },
            }}
            transition={{ duration: 0.3 }}
            className="collapse-content"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(InventoryCollapsibleTitle);
