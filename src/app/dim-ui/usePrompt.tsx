import { t } from 'app/i18next-t';
import { useState } from 'react';
import useDialog, { Body, Buttons, Title } from './useDialog';
import styles from './usePrompt.m.scss';

export interface PromptOpts {
  defaultValue?: string;
  okLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
}

/**
 * Replacement for window.prompt, returns an element you need to render, and a
 * confirm function you can use to show prompt dialogs.
 */
export default function usePrompt(): [
  element: React.ReactNode,
  prompt: (message: string, opts?: PromptOpts) => Promise<string | null>
] {
  const [value, setValue] = useState<string>();
  const [dialog, showDialog] = useDialog<PromptOpts & { message: React.ReactNode }, string | null>(
    (args, close) => (
      <>
        <Title>
          <h2>{args.message}</h2>
        </Title>
        <Body>
          <input
            autoFocus
            className={styles.input}
            type="text"
            value={value ?? args.defaultValue ?? ''}
            onChange={(e) => setValue(e.target.value)}
          />
        </Body>
        <Buttons>
          <button
            className="dim-button"
            type="button"
            onClick={() => close(value ?? args.defaultValue ?? '')}
          >
            {args.okLabel ?? t('Notification.OK')}
          </button>
          <button className="dim-button" type="button" onClick={() => close(null)}>
            {args.cancelLabel ?? t('Notification.Cancel')}
          </button>
        </Buttons>
      </>
    )
  );

  const prompt = (message: string, opts?: PromptOpts) => showDialog({ message, ...opts });

  return [dialog, prompt];
}
