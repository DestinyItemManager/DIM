import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import { sortedStoresSelector } from '../inventory/selectors';
import './CharacterOrderEditor.scss';
import { AppIcon, refreshIcon } from '../shell/icons';

/**
 * An editor for character orders, with drag and drop.
 */
export default function CharacterOrderEditor({
  onSortOrderChanged,
}: {
  onSortOrderChanged(order: string[]): void;
}) {
  const characters = useSelector(sortedStoresSelector);

  const moveItem = (oldIndex: number, newIndex: number) => {
    newIndex = Math.min(characters.length, Math.max(newIndex, 0));
    const order = reorder(
      characters.filter((c) => !c.isVault).map((c) => c.id),
      oldIndex,
      newIndex
    );
    onSortOrderChanged(order);
  };

  const onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    moveItem(result.source.index, result.destination.index);
  };

  if (!characters.length) {
    return (
      <div className="character-order-editor">
        <AppIcon icon={refreshIcon} spinning={true} /> Loading characters...
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="characters" direction="horizontal">
        {(provided) => (
          <div className="character-order-editor" ref={provided.innerRef}>
            {characters
              .filter((c) => !c.isVault)
              .map((character, index) => (
                <Draggable draggableId={character.id} index={index} key={character.id}>
                  {(provided, snapshot) => (
                    <div
                      className={clsx('character-order-editor-item', {
                        'is-dragging': snapshot.isDragging,
                      })}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <div className="sortable-character">
                        <img src={character.icon} />
                        <div className="character-text">
                          <span className="power-level">{character.powerLevel}</span>{' '}
                          {character.className}
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

// a little function to help us with reordering the result
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}
