import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { reorder } from 'app/utils/collections';
import { clamp } from 'es-toolkit';
import { useSelector } from 'react-redux';
import { sortedStoresSelector } from '../inventory/selectors';
import { AppIcon, refreshIcon } from '../shell/icons';
import styles from './CharacterOrderEditor.m.scss';

/**
 * An editor for character orders, with drag and drop.
 */
export default function CharacterOrderEditor({
  onSortOrderChanged,
}: {
  onSortOrderChanged: (order: string[]) => void;
}) {
  const characters = useSelector(sortedStoresSelector);

  const moveItem = (oldIndex: number, newIndex: number) => {
    newIndex = clamp(newIndex, 0, characters.length);
    const order = reorder(
      characters.filter((c) => !c.isVault).map((c) => c.id),
      oldIndex,
      newIndex,
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
      <div className={styles.editor}>
        <AppIcon icon={refreshIcon} spinning={true} /> Loading characters...
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="characters" direction="horizontal">
        {(provided) => (
          <div className={styles.editor} ref={provided.innerRef}>
            {characters.map(
              (character, index) =>
                !character.isVault && (
                  <Draggable draggableId={character.id} index={index} key={character.id}>
                    {(provided) => (
                      <div
                        className={styles.item}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <div className={styles.character}>
                          <img src={character.icon} />
                          <div>
                            <span className={styles.powerLevel}>{character.powerLevel}</span>{' '}
                            {character.className}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ),
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
