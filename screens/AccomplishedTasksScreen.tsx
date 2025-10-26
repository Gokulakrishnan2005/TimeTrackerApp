import React, { FC, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { taskService, DailyTask, Goal } from '../services/taskService';
import { colors } from '../constants/colors';
import { spacing, typography } from '../constants/theme';

type AccomplishedItem = (DailyTask | Goal) & { archivedAt: string };

export const AccomplishedTasksScreen: FC = () => {
  const [items, setItems] = useState<AccomplishedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAccomplishedItems = async () => {
    try {
      const tasks = await taskService.getAccomplishedTasks();
      setItems(tasks.sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()));
    } catch (error) {
      Alert.alert('Error', 'Failed to load accomplished items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAccomplishedItems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAccomplishedItems();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Accomplished Tasks</Text>
        {loading ? (
          <Text>Loading...</Text>
        ) : items.length === 0 ? (
          <Text>No accomplished tasks yet.</Text>
        ) : (
          items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDate}>
                Completed on: {new Date(item.archivedAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
  },
  itemCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  itemTitle: {
    ...typography.h3,
  },
  itemDate: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
