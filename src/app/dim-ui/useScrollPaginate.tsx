import { motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';

/**
 * A hook that can detect when the container has been scrolled to the
 * end of the visible items and will increase the number of items to show.
 *
 * It is recommended that your individual items be memoized so they don't
 * re-render every time you page.
 *
 * @example
 * const [numItemsToShow, _resetPage, marker] = useScrollPaginate(10);
 * return <div>
 *   {_.take(allItems, numItemsToShow) => <Item/>}
 *   {marker}
 * </div>
 */
export default function useScrollPaginate(pageSize: number) {
  const [numItemsToShow, setItemsToShow] = useState(pageSize);

  const resetPage = useCallback(() => setItemsToShow(pageSize), [pageSize]);

  const handlePaginate = useCallback(
    () => setItemsToShow((itemsToShow) => itemsToShow + pageSize),
    [pageSize]
  );

  const marker = useMemo(
    () => (
      <motion.div key="marker" onViewportEnter={handlePaginate} viewport={{ margin: '20px' }} />
    ),
    [handlePaginate]
  );

  return [numItemsToShow, resetPage, marker] as const;
}
