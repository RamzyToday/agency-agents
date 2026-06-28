import Anthropic from '@anthropic-ai/sdk';
import { IntakeMessage, ExtractedTask } from './types';

const SYSTEM_PROMPT = `You are Focus, an ADHD productivity assistant. Your job is to help users capture tasks and assign them to the Eisenhower Matrix.

Eisenhower Matrix quadrants:
- do-first: Urgent AND Important (deadlines, crises, time-sensitive and high-impact)
- schedule: Important but NOT Urgent (planning, growth, relationships — schedule for later)
- delegate: Urgent but NOT Important (interruptions, tasks others could do)
- eliminate: Neither Urgent nor Important (time wasters, low-value)

Your intake process:
1. Acknowledge the task warmly in ONE sentence
2. Ask ONE follow-up question to clarify urgency or importance — keep it short and conversational
3. After 1-2 exchanges you should have enough to assign a quadrant
4. Once you know enough, end your message with a task_complete JSON block

Rules:
- Keep every response to 2-3 sentences MAX. This is a mobile app.
- Ask only ONE question at a time. Never list multiple questions.
- Be warm and non-judgmental. No pressure.
- When ready, include this EXACT block at the end of your message (nothing after it):

<task_complete>
{"title":"Short task title","quadrant":"do-first|schedule|delegate|eliminate","deadline":"YYYY-MM-DD or null","effortMinutes":30,"isDelegatable":false,"notes":"optional context"}
</task_complete>`;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }
  return client;
}

export function parseTaskFromResponse(text: string): ExtractedTask | null {
  const match = text.match(/<task_complete>\s*([\s\S]*?)\s*<\/task_complete>/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    return {
      title: parsed.title,
      quadrant: parsed.quadrant,
      deadline: parsed.deadline === 'null' ? undefined : parsed.deadline ?? undefined,
      effortMinutes: parsed.effortMinutes ?? undefined,
      isDelegatable: parsed.isDelegatable ?? false,
      notes: parsed.notes ?? undefined,
    };
  } catch {
    return null;
  }
}

export function stripTaskBlock(text: string): string {
  return text.replace(/<task_complete>[\s\S]*?<\/task_complete>/, '').trim();
}

export async function sendIntakeMessage(
  messages: IntakeMessage[],
  userMessage: string
): Promise<string> {
  const history: Anthropic.MessageParam[] = [
    ...messages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: history,
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

export async function startIntake(initialText: string): Promise<string> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: initialText }],
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}
