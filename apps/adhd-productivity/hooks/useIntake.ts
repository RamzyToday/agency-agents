import { useState, useCallback } from 'react';
import { IntakeMessage, ExtractedTask, Task } from '@/lib/types';
import { startIntake, sendIntakeMessage, parseTaskFromResponse, stripTaskBlock } from '@/lib/claude';
import { createTask } from '@/lib/tasks';

type IntakeState = 'idle' | 'thinking' | 'active' | 'saving' | 'done' | 'error';

// onDone receives the saved task so the caller can decide what to do next
export function useIntake(onDone: (task: Task) => void) {
  const [state, setState] = useState<IntakeState>('idle');
  const [messages, setMessages] = useState<IntakeMessage[]>([]);
  const [extractedTask, setExtractedTask] = useState<ExtractedTask | null>(null);
  const [savedTask, setSavedTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finish = useCallback(
    async (extracted: ExtractedTask) => {
      setState('saving');
      const task = await createTask(extracted);
      setSavedTask(task);
      setState('done');
      setTimeout(() => onDone(task), 1500);
    },
    [onDone]
  );

  const begin = useCallback(
    async (initialText: string) => {
      setState('thinking');
      setMessages([]);
      setSavedTask(null);
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
          await finish(extracted);
        } else {
          setState('active');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
        setState('error');
      }
    },
    [finish]
  );

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
          await finish(extracted);
        } else {
          setState('active');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
        setState('active');
      }
    },
    [state, messages, finish]
  );

  const reset = useCallback(() => {
    setState('idle');
    setMessages([]);
    setExtractedTask(null);
    setSavedTask(null);
    setError(null);
  }, []);

  return { state, messages, extractedTask, savedTask, error, begin, reply, reset };
}
