import { t } from 'app/i18next-t';
import { isWindows } from 'app/utils/browsers';
import { useCallback, useState } from 'react';
import useDialog, { Body, Buttons, Title } from './useDialog';
import * as styles from './usePrompt.m.scss';

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
  prompt: (message: string, opts?: PromptOpts) => Promise<string | null>,
] {
  const [dialog, showDialog] = useDialog<PromptOpts & { message: React.ReactNode }, string | null>(
    (args, close) => (
      <PromptDialog
        message={args.message}
        defaultValue={args.defaultValue}
        okLabel={args.okLabel}
        cancelLabel={args.cancelLabel}
        close={close}
      />
    ),
  );

  const prompt = (message: string, opts?: PromptOpts) => showDialog({ message, ...opts });

  return [dialog, prompt];
}

function PromptDialog({
  message,
  okLabel,
  cancelLabel,
  defaultValue,
  close,
}: {
  message: React.ReactNode;
  defaultValue?: string;
  okLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  close: (result: string | null) => void;
}) {
  const [value, setValue] = useState<string>(defaultValue ?? '');

  const cancel = useCallback(() => close(null), [close]);
  const ok = useCallback(() => close(value), [close, value]);

  const okButton = (
    <button className="dim-button dim-button-primary" type="button" onClick={ok} autoFocus>
      {okLabel ?? t('Dialog.OK')}
    </button>
  );

  const cancelButton = (
    <button className="dim-button" type="button" onClick={cancel}>
      {cancelLabel ?? t('Dialog.Cancel')}
    </button>
  );

  return (
    <>
      <Title>{message}</Title>
      <Body>
        <input
          autoFocus
          className={styles.input}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </Body>
      <Buttons>
        {isWindows() ? (
          <>
            {cancelButton}
            {okButton}
          </>
        ) : (
          <>
            {okButton}
            {cancelButton}
          </>
        )}
      </Buttons>
    </>
  );
}
