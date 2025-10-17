import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddTaskModal from '../components/AddTaskModal';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { colors } from '../constants/colors';
import { spacing, typography, radii } from '../constants/theme';

interface Habit {
  id: string;
  name: string;
  icon: string;
  currentStreak: number;
  longestStreak: number;
  isCompletedToday: boolean;
}

interface DailyTask {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  date: string;
}

interface Goal {
  id: string;
  type: 'weekly' | 'monthly' | 'yearly';
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  progress: number;
  isCompleted: boolean;
  imageUrl?: string | null;
}

const TasksScreen: React.FC = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [updatingGoal, setUpdatingGoal] = useState<Record<string, boolean>>({});
  const [visionUrl, setVisionUrl] = useState('');
  const [selectedGoalForVision, setSelectedGoalForVision] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadTaskData();
  }, []);

  const loadTaskData = async () => {
    try {
      setIsLoading(true);

      // Load habits
      const habitsData = await taskService.getHabits();
      setHabits(habitsData);

      // Load today's tasks
      const tasksData = await taskService.getDailyTasks();
      setDailyTasks(tasksData);

      // Load goals (weekly/monthly/yearly)
      const [weeklyGoals, monthlyGoals, yearlyGoals] = await Promise.all([
        taskService.getGoals('weekly'),
        taskService.getGoals('monthly'),
        taskService.getGoals('yearly'),
      ]);

      setGoals([...weeklyGoals, ...monthlyGoals, ...yearlyGoals]);

    } catch (error) {
      console.error('Error loading task data:', error);
      Alert.alert('Error', 'Failed to load task data');
    } finally {
      setIsLoading(false);
    }
  };

interface GoalCardProps {
  goal: Goal;
  onIncrement: () => void;
  loading: boolean;
  onSelectVision?: () => void;
  selectedForVision?: boolean;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onIncrement, loading, onSelectVision, selectedForVision }) => {
  return (
    <View style={styles.goalCard}>
      <View style={styles.goalCardHeader}>
        <Text style={styles.goalCardTitle} numberOfLines={2}>{goal.title}</Text>
        <View style={[styles.goalTypePill, goal.type === 'weekly' ? styles.goalTypeWeekly : goal.type === 'monthly' ? styles.goalTypeMonthly : styles.goalTypeYearly]}>
          <Text style={styles.goalTypePillText}>{goal.type.toUpperCase()}</Text>
        </View>
      </View>
      {goal.description ? <Text style={styles.goalCardDescription} numberOfLines={2}>{goal.description}</Text> : null}
      <View style={styles.goalProgressBar}>
        <View style={[styles.goalProgressFill, { width: `${goal.progress}%` }, goal.isCompleted && styles.goalProgressComplete]} />
      </View>
      <View style={styles.goalCardStats}>
        <Text style={styles.goalProgressLabel}>{goal.currentValue}/{goal.targetValue} {goal.unit}</Text>
        <Text style={[styles.goalProgressPercent, goal.isCompleted && styles.goalProgressPercentComplete]}>{goal.progress}%</Text>
      </View>
      <View style={styles.goalCardActions}>
        {!goal.isCompleted && (
          <TouchableOpacity
            style={[styles.goalIncrementButton, loading && styles.goalIncrementButtonDisabled]}
            onPress={onIncrement}
            disabled={loading}
          >
            <Text style={styles.goalIncrementText}>{loading ? '...' : `+1 ${goal.unit}`}</Text>
          </TouchableOpacity>
        )}
        {onSelectVision ? (
          <TouchableOpacity
            style={[styles.visionSelectButton, selectedForVision && styles.visionSelectButtonActive]}
            onPress={onSelectVision}
          >
            <Text style={[styles.visionSelectText, selectedForVision && styles.visionSelectTextActive]}>
              {selectedForVision ? 'Selected' : 'Vision'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

  const groupedGoals = useMemo(() => {
    return {
      weekly: goals.filter((g) => g.type === 'weekly'),
      monthly: goals.filter((g) => g.type === 'monthly'),
      yearly: goals.filter((g) => g.type === 'yearly'),
    };
  }, [goals]);

  const visionGoals = useMemo(() => groupedGoals.yearly.filter((g) => g.imageUrl), [groupedGoals]);

  const handleAddVision = async () => {
    if (!selectedGoalForVision || !visionUrl.trim()) {
      Alert.alert('Add Image', 'Please choose a yearly goal and paste an image URL.');
      return;
    }

    try {
      await taskService.addVisionImage(selectedGoalForVision, visionUrl.trim());
      setVisionUrl('');
      setSelectedGoalForVision(null);
      await loadTaskData();
      Alert.alert('Vision Board', 'Image added successfully!');
    } catch (error: any) {
      Alert.alert('Vision Board', error?.message || 'Failed to save image');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTaskData();
    setIsRefreshing(false);
  };

  const handleCompleteHabit = async (habitId: string) => {
    try {
      await taskService.completeHabit(habitId);
      await loadTaskData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to complete habit');
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await taskService.toggleTaskCompletion(taskId);
      await loadTaskData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, increment: number) => {
    if (updatingGoal[goalId]) return;
    // Optimistic update
    const prevGoals = goals;
    setUpdatingGoal(prev => ({ ...prev, [goalId]: true }));
    setGoals((current) => current.map(g => {
      if (g.id !== goalId) return g;
      const newCurrent = Math.min(g.currentValue + increment, g.targetValue);
      const newProgress = Math.min(100, Math.round((newCurrent / g.targetValue) * 100));
      return {
        ...g,
        currentValue: newCurrent,
        progress: newProgress,
        isCompleted: newCurrent >= g.targetValue,
      };
    }));

    try {
      await taskService.updateGoalProgress(goalId, increment);
      // Optionally, fetch latest for server truth but without full-screen spinner
      // const refreshed = await taskService.getGoals('weekly'); ... merge if needed
    } catch (error) {
      // Revert on failure
      setGoals(prevGoals);
      Alert.alert('Error', 'Failed to update goal progress');
    } finally {
      setUpdatingGoal(prev => ({ ...prev, [goalId]: false }));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your tasks...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={[styles.content, { paddingBottom: 96 + insets.bottom }]}>
          <Text style={styles.title}>My Day</Text>

          <View style={styles.summaryCardWrapper}>
            <View style={styles.summaryHero}>
              <View>
                <Text style={styles.summaryHeroLabel}>Today</Text>
                <Text style={styles.summaryHeroDate}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
              </View>
              <TouchableOpacity style={styles.quickAddButton} onPress={() => setShowAddModal(true)}>
                <Text style={styles.quickAddText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.summaryStatsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Habits</Text>
                <Text style={styles.statValue}>{habits.filter((h) => h.isCompletedToday).length}/{habits.length}</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Tasks</Text>
                <Text style={styles.statValue}>{dailyTasks.filter((t) => t.isCompleted).length}/{dailyTasks.length}</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Goals</Text>
                <Text style={styles.statValue}>{goals.filter((g) => g.isCompleted).length}/{goals.length}</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardSection}>
            <Text style={styles.sectionLabel}>Daily Habits</Text>
            {habits.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>📋</Text>
                <Text style={styles.emptyTitle}>No habits yet</Text>
                <Text style={styles.emptySubtitle}>Create habits to build consistency.</Text>
              </View>
            ) : (
              habits.map((habit) => (
                <TouchableOpacity
                  key={habit.id}
                  style={[styles.habitRow, habit.isCompletedToday && styles.habitRowCompleted]}
                  onPress={() => handleCompleteHabit(habit.id)}
                >
                  <View style={[styles.habitIndicator, habit.isCompletedToday && styles.habitIndicatorCompleted]}>
                    {habit.isCompletedToday && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitName, habit.isCompletedToday && styles.habitNameCompleted]}>
                      {habit.icon} {habit.name}
                    </Text>
                    <Text style={styles.habitMeta}>🔥 {habit.currentStreak}-day streak</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.cardSection}>
            <Text style={styles.sectionLabel}>Daily Tasks</Text>
            {dailyTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>✅</Text>
                <Text style={styles.emptyTitle}>No tasks for today</Text>
                <Text style={styles.emptySubtitle}>Add tasks to stay organized.</Text>
              </View>
            ) : (
              dailyTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskRow, task.isCompleted && styles.taskRowCompleted]}
                  onPress={() => handleToggleTask(task.id)}
                >
                  <TouchableOpacity
                    style={[styles.taskCheckbox, task.isCompleted && styles.taskCheckboxCompleted]}
                    onPress={() => handleToggleTask(task.id)}
                  >
                    {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, task.isCompleted && styles.taskTitleCompleted]}>{task.title}</Text>
                    {task.description ? (
                      <Text style={[styles.taskDescription, task.isCompleted && styles.taskDescriptionCompleted]}>
                        {task.description}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.cardSection}>
            <Text style={styles.sectionLabel}>Weekly Goals</Text>
            {groupedGoals.weekly.length === 0 ? (
              <Text style={styles.emptyInline}>No weekly goals yet.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalScroller}>
                {groupedGoals.weekly.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onIncrement={() => handleUpdateGoalProgress(goal.id, 1)} loading={!!updatingGoal[goal.id]} />
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.cardSection}>
            <Text style={styles.sectionLabel}>Monthly Goals</Text>
            {groupedGoals.monthly.length === 0 ? (
              <Text style={styles.emptyInline}>No monthly goals yet.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalScroller}>
                {groupedGoals.monthly.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onIncrement={() => handleUpdateGoalProgress(goal.id, 1)} loading={!!updatingGoal[goal.id]} />
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.cardSection}>
            <Text style={styles.sectionLabel}>Yearly Goals</Text>
            {groupedGoals.yearly.length === 0 ? (
              <Text style={styles.emptyInline}>No yearly goals yet.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalScroller}>
                {groupedGoals.yearly.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onIncrement={() => handleUpdateGoalProgress(goal.id, 1)}
                    loading={!!updatingGoal[goal.id]}
                    onSelectVision={() => setSelectedGoalForVision(goal.id)}
                    selectedForVision={selectedGoalForVision === goal.id}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.cardSection}>
            <View style={styles.visionHeader}>
              <Text style={styles.sectionLabel}>Vision Board</Text>
              {groupedGoals.yearly.length > 0 && (
                <View style={styles.visionForm}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.visionGoalPicker}>
                    {groupedGoals.yearly.map((goal) => (
                      <TouchableOpacity
                        key={goal.id}
                        style={[styles.visionGoalChip, selectedGoalForVision === goal.id && styles.visionGoalChipActive]}
                        onPress={() => setSelectedGoalForVision(goal.id)}
                      >
                        <Text style={[styles.visionGoalChipText, selectedGoalForVision === goal.id && styles.visionGoalChipTextActive]}>
                          {goal.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View style={styles.visionInputRow}>
                    <TextInput
                      style={styles.visionInput}
                      value={visionUrl}
                      onChangeText={setVisionUrl}
                      placeholder="Paste image URL"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <TouchableOpacity style={styles.visionAddButton} onPress={handleAddVision}>
                      <Text style={styles.visionAddButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {visionGoals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>🌟</Text>
                <Text style={styles.emptyTitle}>No vision images yet</Text>
                <Text style={styles.emptySubtitle}>Select a yearly goal, paste an image URL, and build your board.</Text>
              </View>
            ) : (
              <View style={styles.visionGrid}>
                {visionGoals.map((goal) => (
                  <View key={goal.id} style={styles.visionTile}>
                    <Image source={{ uri: goal.imageUrl as string }} style={styles.visionImage} />
                    <Text numberOfLines={2} style={styles.visionCaption}>{goal.title}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Quick Actions Bar (always visible) */}
      {goals.length > 0 && (
        <View style={[styles.quickBar, { bottom: 16 + insets.bottom }]} pointerEvents="box-none">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickScroll}
          >
            {goals.filter(g => !g.isCompleted).map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.quickButton, updatingGoal[goal.id] && styles.quickButtonDisabled]}
                onPress={() => !updatingGoal[goal.id] && handleUpdateGoalProgress(goal.id, 1)}
                activeOpacity={0.85}
              >
                <Text style={styles.quickButtonText}>+1 {goal.unit}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Floating Action Button (kept above quick bar) */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 16 + insets.bottom }]}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Task Modal */}
      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onItemAdded={loadTaskData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  summaryCardWrapper: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryHeroLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  summaryHeroDate: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  quickAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  quickAddText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.surface,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  checkmark: {
    color: colors.surface,
    fontWeight: '700',
  },
  cardSection: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 36,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyInline: {
    ...typography.body,
    color: colors.textSecondary,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  habitRowCompleted: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  habitIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  habitIndicatorCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  habitNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#22C55E',
  },
  habitMeta: {
    ...typography.caption,
    color: '#F59E0B',
    marginTop: 2,
  },
  taskRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskRowCompleted: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  taskInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  taskTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#22C55E',
  },
  taskDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  taskDescriptionCompleted: {
    color: '#15803D',
  },
  goalScroller: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  goalCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginRight: spacing.md,
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  goalCardTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  goalTypePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primary + '12',
  },
  goalTypeWeekly: {
    backgroundColor: '#DBEAFE',
  },
  goalTypeMonthly: {
    backgroundColor: '#FEE2E2',
  },
  goalTypeYearly: {
    backgroundColor: '#DCFCE7',
  },
  goalTypePillText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  goalCardDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  goalProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  goalProgressComplete: {
    backgroundColor: '#16A34A',
  },
  goalCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalProgressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  goalProgressPercent: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  goalProgressPercentComplete: {
    color: '#16A34A',
  },
  goalCardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  goalIncrementButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  goalIncrementButtonDisabled: {
    opacity: 0.6,
  },
  goalIncrementText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '700',
  },
  visionSelectButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  visionSelectButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  visionSelectText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  visionSelectTextActive: {
    color: colors.primary,
  },
  visionHeader: {
    gap: spacing.md,
  },
  visionForm: {
    gap: spacing.sm,
  },
  visionGoalPicker: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  visionGoalChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  visionGoalChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  visionGoalChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  visionGoalChipTextActive: {
    color: colors.primary,
  },
  visionInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  visionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    ...typography.body,
    color: colors.textPrimary,
  },
  visionAddButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  visionAddButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '700',
  },
  visionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  visionTile: {
    width: 96,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  visionImage: {
    width: '100%',
    height: 80,
  },
  visionCaption: {
    ...typography.caption,
    color: colors.textPrimary,
    padding: spacing.sm,
  },
  quickBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  quickScroll: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  quickButton: {
    backgroundColor: '#5B6FED',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  quickButtonDisabled: {
    opacity: 0.6,
  },
  quickButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 24,
    color: colors.surface,
    fontWeight: 'bold',
  },
});

export default TasksScreen;
