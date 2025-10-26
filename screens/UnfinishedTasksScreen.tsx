import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback } from 'react';
import { colors } from '../constants/colors';
import { spacing, typography, radii } from '../constants/theme';
import taskService, { DailyTask, Goal } from '../services/taskService';

type ItemType = 'tasks' | 'goals';

interface TaskItem extends DailyTask {
  archivedAt: string;
  period: string;
  originalDate: string;
}

interface GoalItem extends Goal {
  archivedAt: string;
  originalPeriod: string;
}

const UnfinishedTasksScreen: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();

  // Determine if showing tasks or goals based on route params
  const itemType: ItemType = (route.params as any)?.type || 'tasks';

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('UI: Loading unfinished items for type:', itemType);
      if (itemType === 'tasks') {
        const archive = await taskService.getUnfinishedTasks() as TaskItem[];
        console.log('UI: Loaded unfinished tasks:', archive.length);
        setTasks(archive);
      } else {
        const archive = await taskService.getUnfinishedGoals() as GoalItem[];
        console.log('UI: Loaded unfinished goals:', archive.length);
        setGoals(archive);
      }
    } catch (error) {
      console.error('UI: Error loading unfinished items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [itemType]);

  useEffect(() => {
    const title = itemType === 'tasks' ? 'Unfinished Tasks' : 'Unfinished Goals';
    navigation.setOptions({ title });
    loadItems();
  }, [loadItems, navigation, itemType]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const handleRestoreTask = (taskId: string) => {
    Alert.alert(
      'Restore Task',
      'Move this task back to today\'s active tasks?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await taskService.restoreTask(taskId);
              loadItems();
              Alert.alert('Success', 'Task restored successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to restore task');
            }
          }
        }
      ]
    );
  };

  const handleRestoreGoal = (goalId: string) => {
    Alert.alert(
      'Restore Goal',
      'Move this goal back to active goals with a new timeline?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await taskService.restoreGoal(goalId);
              loadItems();
              Alert.alert('Success', 'Goal restored successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to restore goal');
            }
          }
        }
      ]
    );
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    Alert.alert(
      'Delete Task',
      `Permanently delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('UI: Attempting to delete task:', taskId);
              await taskService.deleteUnfinishedTask(taskId);
              console.log('UI: Task deleted successfully, refreshing UI');
              await loadItems();
              Alert.alert('Success', 'Task deleted permanently');
            } catch (error) {
              console.error('UI: Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const handleDeleteGoal = (goalId: string, title: string) => {
    Alert.alert(
      'Delete Goal',
      `Permanently delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('UI: Attempting to delete goal:', goalId);
              await taskService.deleteUnfinishedGoal(goalId);
              console.log('UI: Goal deleted successfully, refreshing UI');
              await loadItems();
              Alert.alert('Success', 'Goal deleted permanently');
            } catch (error) {
              console.error('UI: Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const renderTaskItem = ({ item }: { item: TaskItem }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.restoreButton]}
            onPress={() => handleRestoreTask(item.id)}
          >
            <Text style={styles.restoreButtonText}>Restore</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteTask(item.id, item.title)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      {!!item.description && <Text style={styles.taskDescription}>{item.description}</Text>}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Created: {formatDate(item.date)}</Text>
        {item.period && <Text style={styles.periodBadge}>{item.period.toUpperCase()}</Text>}
      </View>
      <Text style={styles.archivedText}>Archived: {formatDate(item.archivedAt)}</Text>
    </View>
  );

  const renderGoalItem = ({ item }: { item: GoalItem }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.restoreButton]}
            onPress={() => handleRestoreGoal(item.id)}
          >
            <Text style={styles.restoreButtonText}>Restore</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteGoal(item.id, item.title)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      {!!item.description && <Text style={styles.taskDescription}>{item.description}</Text>}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Period: {item.originalPeriod}</Text>
        <Text style={styles.metaText}>Progress: {item.progress.toFixed(0)}%</Text>
      </View>
      <Text style={styles.archivedText}>Archived: {formatDate(item.archivedAt)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        {itemType === 'tasks'
          ? 'Tasks carried over from previous days'
          : 'Goals that expired without completion'
        }
      </Text>
      {itemType === 'tasks' ? (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No unfinished tasks 🎉</Text>
            </View>
          }
          renderItem={renderTaskItem}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadItems} />
          }
          contentContainerStyle={tasks.length === 0 ? styles.emptyContainer : undefined}
          extraData={tasks.length} // Force re-render when data changes
        />
      ) : (
        <FlatList
          data={goals}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No unfinished goals 🎉</Text>
            </View>
          }
          renderItem={renderGoalItem}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadItems} />
          }
          contentContainerStyle={goals.length === 0 ? styles.emptyContainer : undefined}
          extraData={goals.length} // Force re-render when data changes
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  taskCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  taskTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButton: {
    backgroundColor: colors.info,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  restoreButtonText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
  },
  deleteButtonText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
  },
  taskDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  periodBadge: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontWeight: '600',
  },
  archivedText: {
    ...typography.caption,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default UnfinishedTasksScreen;
