import { DimItem } from 'app/inventory/item-types';
import { Subject } from 'rxjs';

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
