import { collapsedSelector } from 'app/dim-api/selectors';
import { CollapseIcon, CollapsedSection } from 'app/dim-ui/CollapsibleTitle';
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
import { toggleCollapsedSection } from '../settings/actions';
import * as styles from './InventoryCollapsibleTitle.m.scss';

export default function InventoryCollapsibleTitle({
  sectionId,
  title,
  children,
  stores,
}: {
  sectionId: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  stores: DimStore[];
}) {
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

  const id = useId();
  const contentId = `content-${id}`;
  const headerId = `header-${id}`;

  return (
    <>
      <div
        className={clsx('store-row', {
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
              <h3
                key={store.id}
                className={clsx(styles.title, 'store-cell', {
                  [styles.collapsed]: collapsed,
                  [styles.postmasterFull]: showPostmasterFull,
                  [styles.spanColumns]: !checkPostmaster,
                })}
              >
                {index === 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={toggle}
                      aria-expanded={!collapsed}
                      aria-controls={contentId}
                      id={headerId}
                    >
                      <CollapseIcon collapsed={collapsed} />
                      {showPostmasterFull ? text : title}
                    </button>
                    <span>
                      {checkPostmaster && (
                        <span className={styles.bucketSize}>
                          ({postMasterSpaceUsed}/{POSTMASTER_SIZE})
                        </span>
                      )}
                      {collapsed && !checkPostmaster && (
                        <span className={styles.clickToExpand}>{t('Inventory.ClickToExpand')}</span>
                      )}
                    </span>
                  </>
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
              </h3>
            );
          })}
      </div>

      <CollapsedSection collapsed={collapsed} headerId={headerId} contentId={contentId}>
        {children}
      </CollapsedSection>
    </>
  );
}
