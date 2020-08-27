import { Subject } from 'rxjs';
import { DimItem } from 'app/inventory/item-types';

export interface DragGhostProps {
  item?: DimItem;
  transform?: string;
}

export const showDragGhost$ = new Subject<DragGhostProps>();

/**
 * Show the drag ghost item
 */
export function showDragGhost(props?: DragGhostProps) {
  showDragGhost$.next(props);
}
