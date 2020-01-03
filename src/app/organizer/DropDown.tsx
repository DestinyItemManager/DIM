import React, { useState, ReactNode, useCallback } from 'react';
import styles from './DropDown.m.scss';
import {
  AppIcon,
  openDropdownIcon,
  enabledIcon,
  unselectedCheckIcon,
  reorderIcon
} from 'app/shell/icons';
import ClickOutside from 'app/dim-ui/ClickOutside';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

export interface DropDownItem {
  id: string;
  content: ReactNode;
  checked?: boolean;
  onItemSelect?(): void;
}

function MenuItem({ item }: { item: DropDownItem }) {
  const { checked } = item;
  let icon;
  if (checked !== undefined) {
    icon = <AppIcon icon={checked ? enabledIcon : unselectedCheckIcon} />;
  }

  return (
    <div key={item.id} className={`check-button ${styles.checkButton}`} onClick={item.onItemSelect}>
      <label>{item.content}</label>
      {icon}
    </div>
  );
}

function Menu({ items }: { items: DropDownItem[] }) {
  return (
    <div className={styles.menu}>
      {items.map((item) => (
        <MenuItem key={item.id} item={item} />
      ))}
    </div>
  );
}

function OrderedMenuItem({ item, index }: { item: DropDownItem; index: number }) {
  const { checked, content, onItemSelect } = item;

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided) => (
        <div
          className={`${styles.orderedMenuItem} ${item.checked ? '' : ' disabled'}`}
          data-index={index}
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={onItemSelect}
        >
          <span className={styles.dragHandle} {...provided.dragHandleProps}>
            <AppIcon icon={reorderIcon} className="reorder-handle" />
          </span>
          <span className={styles.name}>{content}</span>
          <span className={styles.checkIcon}>
            <AppIcon
              icon={checked ? enabledIcon : unselectedCheckIcon}
              className="checked-toggle-icon"
            />
          </span>
        </div>
      )}
    </Draggable>
  );
}

function OrderedMenu({
  items,
  onOrderChange
}: {
  items: DropDownItem[];
  onOrderChange(items: DropDownItem[]): void;
}) {
  const onDragEnd = useCallback(
    (result: DropResult) => {
      // dropped outside the list
      if (!result.destination) {
        return;
      }

      const reorderedItems = [...items];
      const [moved] = reorderedItems.splice(result.source.index, 1);
      reorderedItems.splice(result.destination.index, 0, moved);

      onOrderChange(reorderedItems);
    },
    [items, onOrderChange]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppableMenu">
        {(provided) => (
          <div className={styles.orderedMenu} ref={provided.innerRef} {...provided.droppableProps}>
            {items.map((item, index) => (
              <OrderedMenuItem key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

function DropDown({
  buttonText,
  buttonDisabled,
  dropDownItems,
  onOrderChange
}: {
  buttonText: string;
  buttonDisabled?: boolean;
  dropDownItems: DropDownItem[];
  onOrderChange?(items: DropDownItem[]): void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const onClickOutside = useCallback(() => setDropdownOpen(false), [setDropdownOpen]);
  const onButtonClick = useCallback(() => setDropdownOpen(!dropdownOpen), [
    setDropdownOpen,
    dropdownOpen
  ]);

  return (
    <div className={styles.dropDown}>
      <ClickOutside onClickOutside={onClickOutside}>
        <button
          className={`dim-button ${styles.button}`}
          disabled={buttonDisabled}
          onClick={onButtonClick}
        >
          {buttonText} <AppIcon icon={openDropdownIcon} />
        </button>
        {dropdownOpen &&
          (onOrderChange ? (
            <OrderedMenu items={dropDownItems} onOrderChange={onOrderChange} />
          ) : (
            <Menu items={dropDownItems} />
          ))}
      </ClickOutside>
    </div>
  );
}

export default DropDown;
