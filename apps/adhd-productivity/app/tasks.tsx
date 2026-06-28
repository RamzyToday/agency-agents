import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import { QUADRANT_META } from '@/constants/quadrants';
import { TaskCard } from '@/components/TaskCard';
import { useTasks } from '@/hooks/useTasks';
import { EisenhowerQuadrant } from '@/lib/types';

const QUADRANT_ORDER: EisenhowerQuadrant[] = ['do-first', 'schedule', 'delegate', 'eliminate'];

export default function TasksScreen() {
  const { activeTasks, loading, refresh, markComplete, remove } = useTasks();
  const [expanded, setExpanded] = useState<Set<EisenhowerQuadrant>>(new Set(['do-first', 'schedule']));

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const toggle = (q: EisenhowerQuadrant) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(q) ? next.delete(q) : next.add(q);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>All Tasks</Text>
        <Text style={styles.count}>{activeTasks.length} active</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {QUADRANT_ORDER.map((quadrant) => {
          const tasks = activeTasks.filter((t) => t.quadrant === quadrant);
          const meta = QUADRANT_META[quadrant];
          const isOpen = expanded.has(quadrant);

          return (
            <View key={quadrant} style={styles.section}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle(quadrant)}>
                <Text style={styles.sectionIcon}>{meta.icon}</Text>
                <View style={styles.sectionTitleArea}>
                  <Text style={[styles.sectionTitle, { color: meta.color }]}>{meta.label}</Text>
                  <Text style={styles.sectionSub}>{meta.subtitle}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: meta.mutedColor }]}>
                  <Text style={[styles.badgeText, { color: meta.color }]}>{tasks.length}</Text>
                </View>
                <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isOpen && tasks.length > 0 && (
                <View style={styles.cardList}>
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={() => markComplete(task.id)}
                      onDelete={() => remove(task.id)}
                    />
                  ))}
                </View>
              )}

              {isOpen && tasks.length === 0 && (
                <Text style={styles.emptySection}>No tasks here</Text>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  count: { color: Colors.textSecondary, fontSize: 14 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 8 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitleArea: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionSub: { color: Colors.textMuted, fontSize: 12, marginTop: 1 },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
  chevron: { color: Colors.textMuted, fontSize: 11 },
  cardList: { gap: 1, paddingHorizontal: 8, paddingBottom: 10 },
  emptySection: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    padding: 16,
  },
});
