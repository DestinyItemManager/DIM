import { useState } from 'react';
import styles from './InputModal.m.scss';

interface IInputModal {
  isModalOpen: boolean;
  placeholder: string;
  changeModalInput: (modalInput: string) => void;
  exitModal: () => void;
}

// Reusable modal component that takes user input then sets it in state via handleSubmit() callback

// Requires (input) isModalOpen state from the parent component: const [isModalOpen, setIsModalOpen] = useState(false);
// Requires (input) placeholder string from the parent component;
// Requires (output) functions: changeModalInput() and exitModal() in the parent component;
export function InputModal({ isModalOpen, placeholder, changeModalInput, exitModal }: IInputModal) {
  type InputEvent = React.ChangeEvent<HTMLInputElement>;

  const [inputValue, setInputValue] = useState('');

  function handleChange(event: InputEvent) {
    setInputValue(event.target.value);
  }
  function handleSubmit() {
    changeModalInput(inputValue);
  }
  return (
    <>
      {isModalOpen ? (
        <div className={styles.inputModal}>
          <div className={styles.inputContainer}>
            <label className={styles.label}>{placeholder}</label>
            <input className={styles.input} onChange={(e) => handleChange(e)} />
            <div className={styles.buttons}>
              <button className={styles.submit} type="submit" onClick={() => handleSubmit()}>
                Submit
              </button>
              <button className={styles.cancel} type="submit" onClick={() => exitModal()}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
