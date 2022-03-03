import { collapsedSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { postmasterAlmostFull, postmasterSpaceUsed, POSTMASTER_SIZE } from 'app/loadout/postmaster';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import '../dim-ui/CollapsibleTitle.scss';
import { toggleCollapsedSection } from '../settings/actions';
import { AppIcon, collapseIcon, expandIcon } from '../shell/icons';
import './InventoryCollapsibleTitle.scss';

interface Props {
  sectionId: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  stores: DimStore[];
}

export default function InventoryCollapsibleTitle({
  sectionId,
  title,
  children,
  className,
  stores,
}: Props) {
  const dispatch = useThunkDispatch();
  const collapsed = Boolean(useSelector(collapsedSelector(sectionId)));
  const toggle = useCallback(
    () => dispatch(toggleCollapsedSection(sectionId)),
    [dispatch, sectionId]
  );

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
                  <span>
                    {showPostmasterFull ? text : title}
                    {checkPostmaster && collapsed && (
                      <span className="bucket-size">
                        ({postMasterSpaceUsed}/{POSTMASTER_SIZE})
                      </span>
                    )}
                  </span>
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
