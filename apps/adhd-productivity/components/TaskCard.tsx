import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { QUADRANT_META } from '@/constants/quadrants';
import { Task } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface Props {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
  showQuadrant?: boolean;
}

export function TaskCard({ task, onComplete, onDelete, showQuadrant = false }: Props) {
  const meta = QUADRANT_META[task.quadrant];

  return (
    <View style={[styles.card, { borderLeftColor: meta.color }]}>
      <TouchableOpacity style={styles.checkArea} onPress={onComplete} hitSlop={12}>
        <View style={[styles.check, { borderColor: meta.color }]}>
          {task.isCompleted && <Ionicons name="checkmark" size={14} color={meta.color} />}
        </View>
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={[styles.title, task.isCompleted && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.meta}>
          {showQuadrant && (
            <View style={[styles.chip, { backgroundColor: meta.mutedColor }]}>
              <Text style={[styles.chipText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
            </View>
          )}
          {task.deadline && (
            <View style={styles.chip}>
              <Text style={styles.chipTextMuted}>
                Due {format(parseISO(task.deadline), 'MMM d')}
              </Text>
            </View>
          )}
          {task.effortMinutes && (
            <View style={styles.chip}>
              <Text style={styles.chipTextMuted}>{task.effortMinutes}m</Text>
            </View>
          )}
          {task.googleEventId && (
            <View style={styles.chip}>
              <Text style={styles.chipCal}>📅 On calendar</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity onPress={onDelete} hitSlop={12} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  checkArea: {
    paddingTop: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  titleDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextMuted: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  chipCal: {
    color: Colors.schedule,
    fontSize: 12,
  },
  deleteBtn: {
    paddingTop: 2,
  },
});
