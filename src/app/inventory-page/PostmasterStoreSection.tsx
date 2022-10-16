import { collapsedSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import {
  postmasterAlmostFull,
  postmasterSpaceUsed,
  POSTMASTER_SIZE,
} from 'app/loadout-drawer/postmaster';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import '../dim-ui/CollapsibleTitle.scss';
import { toggleCollapsedSection } from '../settings/actions';
import { AppIcon, collapseIcon, expandIcon } from '../shell/icons';
import styles from './PostmasterStoreSection.m.scss';

/**
 * A special row in inventory for the postmaster which is collapsible and can show
 * when the postmaster is getting full.
 */
export default function PostmasterStoreSection({
  title,
  children,
  stores,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  stores: DimStore[];
}) {
  const sectionId = 'Postmaster';
  const dispatch = useThunkDispatch();
  const collapsed = Boolean(useSelector(collapsedSelector(sectionId)));
  const toggle = useCallback(
    () => dispatch(toggleCollapsedSection(sectionId)),
    [dispatch, sectionId]
  );
  const id = `inventory-${sectionId}`;

  const initialMount = useRef(true);

  useEffect(() => {
    initialMount.current = false;
  }, [initialMount]);

  return (
    <>
      <div className="store-row">
        {stores
          .filter((s) => !s.isVault)
          .map((store, index) => {
            const storeIsDestiny2 = store.destinyVersion === 2;
            const isPostmasterAlmostFull = postmasterAlmostFull(store);
            const postMasterSpaceUsed = postmasterSpaceUsed(store);
            const showPostmasterFull = storeIsDestiny2 && isPostmasterAlmostFull;

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
                className={clsx(styles.title, {
                  [styles.collapsed]: collapsed,
                  [styles.postmasterFull]: showPostmasterFull,
                })}
              >
                {index === 0 ? (
                  <span
                    className={styles.handle}
                    onClick={toggle}
                    aria-expanded={!collapsed}
                    aria-controls={id}
                  >
                    <AppIcon
                      className="collapse-icon"
                      icon={collapsed ? expandIcon : collapseIcon}
                    />{' '}
                    <span>
                      {showPostmasterFull ? text : title}
                      {collapsed && (
                        <span className={styles.bucketSize}>
                          ({postMasterSpaceUsed}/{POSTMASTER_SIZE})
                        </span>
                      )}
                    </span>
                  </span>
                ) : (
                  <>
                    {showPostmasterFull && text}
                    {collapsed && (
                      <span className={styles.bucketSize}>
                        ({postMasterSpaceUsed}/{POSTMASTER_SIZE})
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            id={id}
            key="content"
            initial={initialMount.current ? false : 'collapsed'}
            animate="open"
            exit="collapsed"
            variants={{
              open: { height: 'auto' },
              collapsed: { height: 0 },
            }}
            transition={{ duration: 0.3 }}
            className={styles.content}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
