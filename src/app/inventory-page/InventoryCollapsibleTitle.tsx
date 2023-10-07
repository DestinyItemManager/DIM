import { collapsedSelector } from 'app/dim-api/selectors';
import { CollapsedSection } from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import {
  POSTMASTER_SIZE,
  postmasterAlmostFull,
  postmasterSpaceUsed,
} from 'app/loadout-drawer/postmaster';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import React, { useCallback, useEffect, useId, useRef } from 'react';
import { useSelector } from 'react-redux';
import '../dim-ui/CollapsibleTitle.scss';
import { toggleCollapsedSection } from '../settings/actions';
import { AppIcon, collapseIcon, expandIcon } from '../shell/icons';
import styles from './InventoryCollapsibleTitle.m.scss';
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
    [dispatch, sectionId],
  );

  const checkPostmaster = sectionId === 'Postmaster';
  if (!checkPostmaster) {
    // Only the postmaster needs a header per store, the rest span across all stores
    stores = [stores[0]];
  }

  const initialMount = useRef(true);

  useEffect(() => {
    initialMount.current = false;
  }, [initialMount]);

  const contentId = useId();
  const headerId = useId();

  return (
    <>
      <div
        className={clsx('store-row', 'inventory-title', {
          collapsed,
        })}
      >
        {stores
          .filter((s) => !s.isVault)
          .map((store, index) => {
            const storeIsDestiny2 = store.destinyVersion === 2;
            const isPostmasterAlmostFull = postmasterAlmostFull(store);
            const postMasterSpaceUsed = postmasterSpaceUsed(store);
            const showPostmasterFull = checkPostmaster && storeIsDestiny2 && isPostmasterAlmostFull;

            const text =
              postMasterSpaceUsed < POSTMASTER_SIZE
                ? t('ItemService.PostmasterAlmostFull')
                : t('ItemService.PostmasterFull');

            return (
              <div
                key={store.id}
                className={clsx('title', 'store-cell', className, {
                  collapsed,
                  [styles.postmasterFull]: showPostmasterFull,
                  [styles.spanColumns]: !checkPostmaster,
                })}
              >
                {index === 0 ? (
                  <button
                    type="button"
                    className="collapse-handle"
                    onClick={toggle}
                    aria-expanded={!collapsed}
                    aria-controls={contentId}
                  >
                    <AppIcon
                      className="collapse-icon"
                      icon={collapsed ? expandIcon : collapseIcon}
                      ariaHidden
                    />{' '}
                    <span id={headerId}>
                      {showPostmasterFull ? text : title}
                      {checkPostmaster && (
                        <span className={styles.bucketSize}>
                          ({postMasterSpaceUsed}/{POSTMASTER_SIZE})
                        </span>
                      )}
                      {collapsed && !checkPostmaster && (
                        <span className={styles.clickToExpand}>{t('Inventory.ClickToExpand')}</span>
                      )}
                    </span>
                  </button>
                ) : (
                  <>
                    {showPostmasterFull && text}
                    {checkPostmaster && (
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

      <CollapsedSection collapsed={collapsed} headerId={headerId} contentId={contentId}>
        {children}
      </CollapsedSection>
    </>
  );
}
