import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import classNames from 'classnames';
import { DimStore } from '../inventory/store-types';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { sortedStoresSelector } from '../inventory/reducer';
import './CharacterOrderEditor.scss';
import { AppIcon, refreshIcon } from '../shell/icons';

interface ProvidedProps {
  onSortOrderChanged(order: string[]): void;
}

interface StoreProps {
  characters: DimStore[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    characters: sortedStoresSelector(state)
  };
}

/**
 * An editor for character orders, with drag and drop.
 */
class CharacterOrderEditor extends React.Component<Props> {
  onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    this.moveItem(result.source.index, result.destination.index);
  };

  render() {
    const { characters } = this.props;

    if (!characters.length) {
      return (
        <div className="character-order-editor">
          <AppIcon icon={refreshIcon} spinning={true} /> Loading characters...
        </div>
      );
    }

    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="characters" direction="horizontal">
          {(provided) => (
            <div className="character-order-editor" ref={provided.innerRef}>
              {characters
                .filter((c) => !c.isVault)
                .map((character, index) => (
                  <Draggable draggableId={character.id} index={index} key={character.id}>
                    {(provided, snapshot) => (
                      <div
                        className={classNames('character-order-editor-item', {
                          'is-dragging': snapshot.isDragging
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

  private moveItem(oldIndex, newIndex) {
    newIndex = Math.min(this.props.characters.length, Math.max(newIndex, 0));
    const order = reorder(
      this.props.characters.filter((c) => !c.isVault).map((c) => c.id),
      oldIndex,
      newIndex
    );
    this.props.onSortOrderChanged(order);
  }
}

// a little function to help us with reordering the result
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}

export default connect(mapStateToProps)(CharacterOrderEditor);
