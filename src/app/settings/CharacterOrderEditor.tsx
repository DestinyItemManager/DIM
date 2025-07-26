import { Reorder } from 'motion/react';
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

  const handleReorder = (newOrder: typeof nonVaultCharacters) => {
    onSortOrderChanged(newOrder.map((c) => c.id));
  };

  if (!characters.length) {
    return (
      <div className={styles.editor}>
        <AppIcon icon={refreshIcon} spinning={true} /> Loading characters...
      </div>
    );
  }

  return (
    <Reorder.Group
      axis="x"
      values={nonVaultCharacters}
      onReorder={handleReorder}
      className={styles.editor}
      as="div"
    >
      {nonVaultCharacters.map((character) => (
        <Reorder.Item key={character.id} value={character} className={styles.item} as="div">
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
