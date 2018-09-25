import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import classNames from 'classnames';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { DimStore } from '../inventory/store-types';
import StoreHeading from '../inventory/StoreHeading';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { storesSelector } from '../inventory/reducer';
import { currentAccountSelector } from '../accounts/reducer';

export interface SortProperty {
  readonly id: string;
  readonly displayName: string;
  readonly enabled: boolean;
  // TODO, should we support up/down?
}

interface ProvidedProps {
  onSortOrderChanged(account: DestinyAccount, order: string[]): void;
}

interface StoreProps {
  currentAccount?: DestinyAccount;
  characters: DimStore[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    characters: storesSelector(state),
    currentAccount: currentAccountSelector(state)
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
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div className="character-order-editor" ref={provided.innerRef}>
              {characters.map((character, index) => (
                <Draggable draggableId={character.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      className={classNames('character-order-editor-item', {
                        'is-dragging': snapshot.isDragging
                      })}
                      data-index={index}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <StoreHeading store={character} internalLoadoutMenu={false} />
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
    const order = reorder(this.props.characters.map((c) => c.id), oldIndex, newIndex);
    this.props.onSortOrderChanged(this.props.currentAccount!, order);
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
