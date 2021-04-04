import { DimItem } from 'app/inventory/item-types';
import { Observable } from 'app/utils/observable';

export interface DragGhostProps {
  item?: DimItem;
  transform?: string;
}

export const showDragGhost$ = new Observable<DragGhostProps | undefined>(undefined);

/**
 * Show the drag ghost item
 */
export function showDragGhost(props?: DragGhostProps) {
  showDragGhost$.next(props);
}
