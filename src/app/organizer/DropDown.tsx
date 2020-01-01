import React, { useState, ReactNode } from 'react';
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
  onItemSelect?(e): void;
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
      {(provided, snapshot) => (
        <div
          className={snapshot.isDragging ? styles.orderedMenuItem : styles.orderedMenuItem}
          data-index={index}
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={onItemSelect}
        >
          <span {...provided.dragHandleProps}>
            <AppIcon icon={reorderIcon} className="reorder-handle" />
          </span>
          <span className="name" {...provided.dragHandleProps}>
            {content}
          </span>
          <AppIcon
            icon={checked ? enabledIcon : unselectedCheckIcon}
            className="sort-button sort-toggle"
          />
        </div>
      )}
    </Draggable>
  );
}

const getOnDragEnd = (items: DropDownItem[], onOrderChange: (items: DropDownItem[]) => void) => (
  result: DropResult
) => {
  // dropped outside the list
  if (!result.destination) {
    return;
  }

  const reorderedItems = [...items];
  const [moved] = reorderedItems.splice(result.source.index, 1);
  reorderedItems.splice(result.destination.index, 0, moved);

  onOrderChange(reorderedItems);
};

function OrderedMenu({
  items,
  onOrderChange
}: {
  items: DropDownItem[];
  onOrderChange(items: DropDownItem[]): void;
}) {
  return (
    <DragDropContext onDragEnd={getOnDragEnd(items, onOrderChange)}>
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

  return (
    <div className={styles.dropDown}>
      <ClickOutside onClickOutside={() => setDropdownOpen(false)}>
        <button
          className={`dim-button ${styles.button}`}
          disabled={buttonDisabled}
          onClick={() => setDropdownOpen(!dropdownOpen)}
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
