import { useState, useCallback } from 'react';
import { IntakeMessage, ExtractedTask } from '@/lib/types';
import { startIntake, sendIntakeMessage, parseTaskFromResponse, stripTaskBlock } from '@/lib/claude';
import { createTask } from '@/lib/tasks';

type IntakeState = 'idle' | 'thinking' | 'active' | 'saving' | 'done' | 'error';

export function useIntake(onDone: () => void) {
  const [state, setState] = useState<IntakeState>('idle');
  const [messages, setMessages] = useState<IntakeMessage[]>([]);
  const [extractedTask, setExtractedTask] = useState<ExtractedTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  const begin = useCallback(async (initialText: string) => {
    setState('thinking');
    setMessages([]);
    setError(null);
    try {
      const response = await startIntake(initialText);
      const extracted = parseTaskFromResponse(response);
      const displayText = stripTaskBlock(response);

      const newMessages: IntakeMessage[] = [
        { role: 'user', content: initialText },
        { role: 'assistant', content: displayText },
      ];
      setMessages(newMessages);

      if (extracted) {
        setExtractedTask(extracted);
        setState('saving');
        await createTask(extracted);
        setState('done');
        setTimeout(onDone, 1500);
      } else {
        setState('active');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setState('error');
    }
  }, [onDone]);

  const reply = useCallback(
    async (userText: string) => {
      if (state !== 'active') return;
      setState('thinking');

      const updatedMessages: IntakeMessage[] = [
        ...messages,
        { role: 'user', content: userText },
      ];
      setMessages(updatedMessages);

      try {
        const response = await sendIntakeMessage(messages, userText);
        const extracted = parseTaskFromResponse(response);
        const displayText = stripTaskBlock(response);

        const finalMessages: IntakeMessage[] = [
          ...updatedMessages,
          { role: 'assistant', content: displayText },
        ];
        setMessages(finalMessages);

        if (extracted) {
          setExtractedTask(extracted);
          setState('saving');
          await createTask(extracted);
          setState('done');
          setTimeout(onDone, 1500);
        } else {
          setState('active');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
        setState('active');
      }
    },
    [state, messages, onDone]
  );

  const reset = useCallback(() => {
    setState('idle');
    setMessages([]);
    setExtractedTask(null);
    setError(null);
  }, []);

  return { state, messages, extractedTask, error, begin, reply, reset };
}
