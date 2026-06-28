const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export interface CalendarEventInput {
  title: string;
  startDateTime: Date;
  durationMinutes: number;
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  htmlLink: string;
}

export async function createCalendarEvent(
  token: string,
  input: CalendarEventInput
): Promise<CalendarEvent> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const end = new Date(input.startDateTime.getTime() + input.durationMinutes * 60_000);

  const body = {
    summary: input.title,
    description: input.notes ? `${input.notes}\n\n— added by Focus` : '— added by Focus',
    start: { dateTime: input.startDateTime.toISOString(), timeZone },
    end: { dateTime: end.toISOString(), timeZone },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 10 }],
    },
  };

  const res = await fetch(CALENDAR_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Calendar API ${res.status}`);
  }

  const data = await res.json();
  return { id: data.id, htmlLink: data.htmlLink };
}

export async function deleteCalendarEvent(token: string, eventId: string): Promise<void> {
  const res = await fetch(`${CALENDAR_API}/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 410) {
    throw new Error(`Calendar delete failed: ${res.status}`);
  }
}
