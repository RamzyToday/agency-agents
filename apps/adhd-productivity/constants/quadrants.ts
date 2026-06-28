import { EisenhowerQuadrant } from '@/lib/types';
import { Colors } from './colors';

export const QUADRANT_META: Record<
  EisenhowerQuadrant,
  { label: string; subtitle: string; color: string; mutedColor: string; icon: string }
> = {
  'do-first': {
    label: 'Do First',
    subtitle: 'Urgent + Important',
    color: Colors.doFirst,
    mutedColor: Colors.doFirstMuted,
    icon: '🔥',
  },
  schedule: {
    label: 'Schedule',
    subtitle: 'Important, Not Urgent',
    color: Colors.schedule,
    mutedColor: Colors.scheduleMuted,
    icon: '📅',
  },
  delegate: {
    label: 'Delegate',
    subtitle: 'Urgent, Not Important',
    color: Colors.delegate,
    mutedColor: Colors.delegateMuted,
    icon: '↗️',
  },
  eliminate: {
    label: 'Eliminate',
    subtitle: 'Neither Urgent nor Important',
    color: Colors.eliminate,
    mutedColor: Colors.eliminateMuted,
    icon: '🗑️',
  },
};
