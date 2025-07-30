import { DimStore } from 'app/inventory/store-types';
import { emptyArray } from 'app/utils/empty';
import { Reorder } from 'motion/react';
import { useState } from 'react';
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
  const nonVaultCharacters = characters.filter((c) => !c.isVault);

  const [draggingOrder, setDraggingOrder] = useState<DimStore[]>(emptyArray);

  const handleReorder = (newOrder: typeof nonVaultCharacters) => {
    setDraggingOrder(newOrder);
  };

  const handleDragEnd = () => {
    console.log('handleDragEnd', draggingOrder);
    onSortOrderChanged(draggingOrder.map((c) => c.id));
    setDraggingOrder(emptyArray());
  };

  if (!characters.length) {
    return (
      <div className={styles.editor}>
        <AppIcon icon={refreshIcon} spinning={true} /> Loading characters...
      </div>
    );
  }

  // When dragging, show the order in state, then switch back to the one from props
  const displayCharacters = draggingOrder.length > 0 ? draggingOrder : nonVaultCharacters;

  return (
    <Reorder.Group
      axis="x"
      values={nonVaultCharacters}
      onReorder={handleReorder}
      className={styles.editor}
      as="div"
    >
      {displayCharacters.map((character) => (
        <Reorder.Item
          key={character.id}
          value={character}
          className={styles.item}
          style={{ cursor: 'grab' }}
          whileDrag={{ cursor: 'grabbing' }}
          onDragEnd={handleDragEnd}
          as="div"
        >
          <div className={styles.character}>
            <img src={character.icon} />
            <div>
              <span className={styles.powerLevel}>{character.powerLevel}</span>{' '}
              {character.className}
            </div>
          </div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
