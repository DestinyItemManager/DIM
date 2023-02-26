import { t } from 'app/i18next-t';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import Dialog, { Body, Buttons, DialogRef, Title } from './Dialog';

// Redecalare forwardRef
declare module 'react' {
  function forwardRef<T, P = {}>(
    render: (props: P, ref: Ref<T>) => ReactElement | null
  ): (props: P & RefAttributes<T>) => ReactElement | null;
}

export interface PromptOpts {
  defaultValue?: string;
  okLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
}

export interface PromptRef {
  prompt: (message: React.ReactNode, opts?: PromptOpts) => Promise<string | null>;
}

const Prompt = forwardRef(function Prompt(_props, ref: React.ForwardedRef<PromptRef>) {
  const dialogRef =
    useRef<DialogRef<PromptOpts & { message: React.ReactNode }, string | null>>(null);

  useImperativeHandle(
    ref,
    () => ({
      prompt: (message, opts) => dialogRef.current!.showDialog({ message, ...opts }),
    }),
    [dialogRef]
  );

  const [value, setValue] = useState<string>();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value);

  return (
    <Dialog ref={dialogRef}>
      {(args, close) => (
        <>
          <Title>
            <h2>{args.message}</h2>
          </Title>
          <Body>
            <input type="text" value={value ?? args.defaultValue ?? ''} onChange={handleChange} />
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
      )}
    </Dialog>
  );
});

/**
 * Replacement for window.prompt, returns an element you need to render, and a
 * confirm function you can use to show prompt dialogs.
 */
export default function usePrompt(): [
  element: React.ReactNode,
  prompt: (message: string, opts?: PromptOpts) => Promise<string | null>
] {
  const ref = useRef<PromptRef>(null);
  const prompt = useCallback(
    (message: string, opts?: PromptOpts) => ref.current!.prompt(message, opts),
    []
  );
  // eslint-disable-next-line react/jsx-key
  return [<Prompt ref={ref} />, prompt];
}
