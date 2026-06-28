import { Task, EisenhowerQuadrant } from './types';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

const QUADRANT_LABELS: Record<EisenhowerQuadrant, string> = {
  'do-first': 'Do First',
  schedule: 'Schedule',
  delegate: 'Delegate',
  eliminate: 'Eliminate',
};

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

function buildProperties(task: Task) {
  const props: Record<string, unknown> = {
    Name: { title: [{ text: { content: task.title } }] },
    Status: { select: { name: task.isCompleted ? 'Done' : 'Active' } },
    Quadrant: { select: { name: QUADRANT_LABELS[task.quadrant] } },
    FocusID: { rich_text: [{ text: { content: task.id } }] },
  };

  if (task.deadline) {
    props.Deadline = { date: { start: task.deadline } };
  }
  if (task.effortMinutes) {
    props['Effort (min)'] = { number: task.effortMinutes };
  }
  if (task.notes) {
    props.Notes = { rich_text: [{ text: { content: task.notes } }] };
  }

  return props;
}

export async function createNotionPage(
  token: string,
  databaseId: string,
  task: Task
): Promise<string> {
  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: buildProperties(task),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Notion API ${res.status}`);
  }

  const data = await res.json();
  return data.id as string;
}

export async function updateNotionPage(
  token: string,
  pageId: string,
  patch: { isCompleted?: boolean; quadrant?: EisenhowerQuadrant }
): Promise<void> {
  const props: Record<string, unknown> = {};

  if (patch.isCompleted !== undefined) {
    props.Status = { select: { name: patch.isCompleted ? 'Done' : 'Active' } };
  }
  if (patch.quadrant) {
    props.Quadrant = { select: { name: QUADRANT_LABELS[patch.quadrant] } };
  }

  const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({ properties: props }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Notion API ${res.status}`);
  }
}

export async function verifyNotionConnection(
  token: string,
  databaseId: string
): Promise<{ name: string }> {
  const res = await fetch(`${NOTION_API}/databases/${databaseId}`, {
    headers: headers(token),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid Notion token');
    if (res.status === 404) throw new Error('Database not found — make sure you shared it with your integration');
    throw new Error(`Notion API ${res.status}`);
  }

  const data = await res.json();
  const titleProp = data.title?.[0]?.plain_text ?? 'Untitled';
  return { name: titleProp };
}
