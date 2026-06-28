import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Colors } from '@/constants/colors';
import { QUADRANT_META } from '@/constants/quadrants';
import { TaskCard } from '@/components/TaskCard';
import { useTasks } from '@/hooks/useTasks';
import { EisenhowerQuadrant } from '@/lib/types';

const QUADRANT_ORDER: EisenhowerQuadrant[] = ['do-first', 'schedule', 'delegate', 'eliminate'];

export default function TodayScreen() {
  const router = useRouter();
  const { activeTasks, loading, refresh, markComplete, remove } = useTasks();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const doFirst = activeTasks.filter((t) => t.quadrant === 'do-first');
  const rest = activeTasks.filter((t) => t.quadrant !== 'do-first');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
            <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          </View>
          <TouchableOpacity style={styles.captureBtn} onPress={() => router.push('/capture')}>
            <Ionicons name="mic" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Do First section — always on top, max 3 */}
        {doFirst.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionIcon]}>{QUADRANT_META['do-first'].icon}</Text>
              <Text style={[styles.sectionTitle, { color: QUADRANT_META['do-first'].color }]}>
                Do First
              </Text>
              <Text style={styles.sectionCount}>{doFirst.length}</Text>
            </View>
            <View style={styles.cardList}>
              {doFirst.slice(0, 3).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => markComplete(task.id)}
                  onDelete={() => remove(task.id)}
                />
              ))}
              {doFirst.length > 3 && (
                <TouchableOpacity onPress={() => router.push('/tasks')}>
                  <Text style={styles.seeMore}>+{doFirst.length - 3} more — see all tasks</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Remaining quadrants */}
        {rest.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>On Deck</Text>
            <View style={styles.cardList}>
              {rest.slice(0, 4).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => markComplete(task.id)}
                  onDelete={() => remove(task.id)}
                  showQuadrant
                />
              ))}
              {rest.length > 4 && (
                <TouchableOpacity onPress={() => router.push('/tasks')}>
                  <Text style={styles.seeMore}>+{rest.length - 4} more — see all tasks</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {activeTasks.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptySubtitle}>Tap the mic to capture your first task.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/capture')}>
              <Ionicons name="mic" size={16} color={Colors.white} />
              <Text style={styles.emptyBtnText}>Capture a task</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { color: Colors.textSecondary, fontSize: 14 },
  date: { color: Colors.text, fontSize: 22, fontWeight: '700', marginTop: 2 },
  captureBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  sectionCount: {
    color: Colors.textMuted,
    fontSize: 13,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cardList: { gap: 8 },
  seeMore: { color: Colors.primary, fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    marginTop: 8,
  },
  emptyBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
});
