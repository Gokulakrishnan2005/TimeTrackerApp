/**
 * Task Service
 *
 * Handles daily tasks, habits, and goals management
 * Integrates with local storage for task and goal operations
 * Provides React-friendly interfaces for task tracking
 */

import { storeData, getData } from './LocalStorage';

/**
 * Habit interface
 */
export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string;
  currentStreak: number;
  longestStreak: number;
  highestStreak: number;
  lastCompletedDate: string | null;
  completedDates: string[];
  isCompletedToday: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Daily task interface
 */
export interface DailyTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  date: string;
  completedAt: string | null;
  isExpired?: boolean; // Added for UI display of expired tasks
  originalDate?: string; // Added for expired tasks
  createdAt: string;
  updatedAt: string;
}

/**
 * Goal interface
 */
export interface Goal {
  id: string;
  userId: string;
  type: 'weekly' | 'monthly' | 'yearly';
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  progress: number;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  imageUrl: string | null;
  isExpired?: boolean; // Added for UI display of expired goals
  originalPeriod?: string; // Added for expired goals
  createdAt: string;
  updatedAt: string;
}

/**
 * Task service class
 * Manages all task and goal operations
 */
class TaskService {
  /**
   * Create a new habit
   */
  async createHabit(habitData: {
    name: string;
    icon?: string;
  }): Promise<Habit> {
    try {
      const storedHabits = (await getData('habits')) as Habit[] | null;
      const habits: Habit[] = storedHabits ? [...storedHabits] : [];
      const newHabit = { 
        ...habitData, 
        icon: habitData.icon || '🎯',
        id: Date.now().toString(), 
        userId: 'local', 
        currentStreak: 0, 
        longestStreak: 0, 
        highestStreak: 0,
        lastCompletedDate: null,
        completedDates: [], 
        isCompletedToday: false, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };
      await storeData('habits', [...habits, newHabit]);
      return newHabit;
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  }

  /**
   * Get unfinished tasks
   */
  async getUnfinishedTasks(): Promise<(DailyTask & { archivedAt: string; period: string; originalDate: string })[]> {
    try {
      const stored = await getData('unfinished_tasks');

      if (!Array.isArray(stored)) {
        console.log('No unfinished tasks found or invalid data format');
        return [];
      }

      const validTasks = stored.filter((item): item is (DailyTask & { archivedAt: string; period: string; originalDate: string }) => {
        return item &&
               typeof item === 'object' &&
               typeof item.id === 'string' &&
               typeof item.title === 'string' &&
               typeof item.date === 'string' &&
               typeof item.archivedAt === 'string' &&
               typeof item.period === 'string' &&
               typeof item.originalDate === 'string';
      });

      return validTasks;
    } catch (error) {
      console.error('Error fetching unfinished tasks:', error);
      return [];
    }
  }

  /**
   * Get all habits with completion status
   */
  async getHabits(): Promise<Habit[]> {
    try {
      return await getData('habits') || [];
    } catch (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
  }

  /**
   * Mark habit as completed for today
   */
  async completeHabit(habitId: string): Promise<Habit> {
    try {
      const storedHabits = (await getData('habits')) as Habit[] | null;
      const habits: Habit[] = storedHabits ? [...storedHabits] : [];
      const index = habits.findIndex((habit: Habit) => habit.id === habitId);
      if (index !== -1) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const habit = habits[index];

        // Already completed today - return early to keep idempotent behaviour
        const alreadyCompleted = habit.completedDates.some((date: string) => date.startsWith(todayStr));
        if (alreadyCompleted) {
          return habit;
        }

        // Determine if yesterday was completed to maintain streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayCompleted = habit.completedDates.some((date: string) => date.startsWith(yesterdayStr));

        if (!yesterdayCompleted) {
          habit.currentStreak = 0;
        }

        habit.isCompletedToday = true;
        habit.completedDates.push(today.toISOString());
        habit.currentStreak += 1;
        habit.lastCompletedDate = today.toISOString();
        
        // Update highest streak
        const highestStreak = Math.max(habit.highestStreak || habit.longestStreak || 0, habit.currentStreak);
        habit.highestStreak = highestStreak;
        
        if (habit.currentStreak > habit.longestStreak) {
          habit.longestStreak = habit.currentStreak;
        }
        habit.updatedAt = new Date().toISOString();

        habits[index] = habit;
        await storeData('habits', habits);
        return habit;
      }
      throw new Error('Habit not found');
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    }
  }

  /**
   * Delete a habit
   */
  async deleteHabit(habitId: string): Promise<void> {
    try {
      const habits = await getData('habits') || [];
      const filtered = habits.filter((habit: Habit) => habit.id !== habitId);
      await storeData('habits', filtered);
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }

  /**
   * Create a new daily task
   */
  async createDailyTask(taskData: {
    title: string;
    description?: string;
    date?: string;
  }): Promise<DailyTask> {
    try {
      const tasks = await getData('tasks') || [];
      const newTask = { 
        ...taskData, 
        date: taskData.date || new Date().toISOString().split('T')[0],
        id: Date.now().toString(), 
        userId: 'local', 
        isCompleted: false, 
        completedAt: null, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };
      await storeData('tasks', [...tasks, newTask]);
      return newTask;
    } catch (error) {
      console.error('Error creating daily task:', error);
      throw error;
    }
  }

  /**
   * Get daily tasks for a specific date (including expired ones so they stay visible)
   */
  async getDailyTasks(date?: string): Promise<DailyTask[]> {
    try {
      // Get active tasks
      const activeTasks = await getData('tasks') || [];

      // Get expired tasks from unfinished storage
      const unfinishedTasks = await this.getUnfinishedTasks();
      const expiredTasks = unfinishedTasks
        .filter(task => task.period === 'daily')
        .map(task => ({
          ...task,
          // Mark as expired for UI display
          isExpired: true,
          originalDate: task.originalDate,
        }));

      // Combine active and expired tasks, removing duplicates by ID
      const taskMap = new Map<string, DailyTask>();

      // Add active tasks first
      activeTasks.forEach((task: DailyTask) => {
        taskMap.set(task.id, { ...task, isExpired: false });
      });

      // Add expired tasks (will overwrite if same ID exists)
      expiredTasks.forEach((task: DailyTask) => {
        taskMap.set(task.id, task);
      });

      // Convert back to array
      const allTasks = Array.from(taskMap.values());

      if (date) {
        return allTasks.filter(task => task.date === date);
      }
      return allTasks;
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
      throw error;
    }
  }

  /**
   * Toggle daily task completion status
   */
  async toggleTaskCompletion(taskId: string): Promise<DailyTask> {
    try {
      const storedTasks = (await getData('tasks')) as DailyTask[] | null;
      const tasks: DailyTask[] = storedTasks ? [...storedTasks] : [];
      const index = tasks.findIndex((task: DailyTask) => task.id === taskId);
      if (index !== -1) {
        const task = tasks[index];
        const todayStr = new Date().toISOString().split('T')[0];
        const lastCompletedStr = task.completedAt?.split('T')[0];

        // Prevent multiple completions in same day
        if (task.isCompleted && lastCompletedStr === todayStr) {
          return task;
        }

        task.isCompleted = !task.isCompleted;
        task.completedAt = task.isCompleted ? new Date().toISOString() : null;
        task.updatedAt = new Date().toISOString();
        tasks[index] = task;

        await storeData('tasks', tasks);
        return task;
      }
      throw new Error('Task not found');
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  }

  /**
   * Carry over unfinished tasks across day/week/month boundaries
   */
  async carryOverTasks(): Promise<void> {
    try {
      const storedTasks = (await getData('tasks')) as DailyTask[] | null;
      const tasks: DailyTask[] = storedTasks ? [...storedTasks] : [];
      const storedArchive = (await getData('unfinished_tasks')) as (DailyTask & { archivedAt?: string; period?: string })[] | null;
      const unfinishedArchive: (DailyTask & { archivedAt?: string; period?: string })[] = storedArchive ? [...storedArchive] : [];
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Daily carry over (copy unfinished from yesterday)
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const yesterdayUnfinished = tasks.filter((task: DailyTask) => task.date === yesterdayStr && !task.isCompleted);
      const carriedTasks = yesterdayUnfinished.map((task: DailyTask) => ({
        ...task,
        id: `${task.id}-${todayStr}`,
        date: todayStr,
        isCompleted: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const nextTasks = [...tasks, ...carriedTasks];

      // Weekly archive (run on Sunday)
      if (now.getDay() === 0) {
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekStr = lastWeek.toISOString().split('T')[0];
        const weeklyUnfinished = nextTasks.filter((task: DailyTask) => task.date === lastWeekStr && !task.isCompleted);

        if (weeklyUnfinished.length) {
          unfinishedArchive.push(...weeklyUnfinished.map((task: DailyTask) => ({ ...task, archivedAt: todayStr, period: 'weekly' })));
        }
      }

      // Monthly archive (run on 1st)
      if (now.getDate() === 1) {
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthStr = lastMonth.toISOString().split('T')[0];
        const monthlyUnfinished = nextTasks.filter((task: DailyTask) => task.date === lastMonthStr && !task.isCompleted);

        if (monthlyUnfinished.length) {
          unfinishedArchive.push(...monthlyUnfinished.map((task: DailyTask) => ({ ...task, archivedAt: todayStr, period: 'monthly' })));
        }
      }

      await storeData('tasks', nextTasks);
      await storeData('unfinished_tasks', unfinishedArchive);
    } catch (error) {
      console.error('Error carrying over tasks:', error);
    }
  }

  /**
   * Delete a daily task
   */
  async deleteDailyTask(taskId: string): Promise<void> {
    try {
      const tasks = await getData('tasks') || [];
      const filtered = tasks.filter((task: DailyTask) => task.id !== taskId);
      await storeData('tasks', filtered);
    } catch (error) {
      console.error('Error deleting daily task:', error);
      throw error;
    }
  }

  /**
   * Create a new goal
   */
  async createGoal(goalData: {
    type: 'weekly' | 'monthly' | 'yearly';
    title: string;
    description?: string;
    targetValue: number;
    unit: string;
    startDate: string;
    endDate: string;
  }): Promise<Goal> {
    try {
      const goals = await getData('goals') || [];
      const newGoal = { 
        ...goalData, 
        description: goalData.description || '',
        id: Date.now().toString(), 
        userId: 'local', 
        currentValue: 0, 
        progress: 0, 
        isCompleted: false, 
        imageUrl: null, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };
      await storeData('goals', [...goals, newGoal]);
      return newGoal;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  /**
   * Get goals by type (including expired ones so they stay visible)
   */
  async getGoals(type?: string): Promise<Goal[]> {
    try {
      // Get active goals
      const activeGoals = await getData('goals') || [];

      // Get expired goals from unfinished storage
      const unfinishedGoals = await this.getUnfinishedGoals();
      const expiredGoals = unfinishedGoals.map(goal => ({
        ...goal,
        // Mark as expired for UI display
        isExpired: true,
        originalPeriod: goal.originalPeriod,
      }));

      // Combine active and expired goals, removing duplicates by ID
      const goalMap = new Map<string, Goal>();

      // Add active goals first
      activeGoals.forEach((goal: Goal) => {
        goalMap.set(goal.id, { ...goal, isExpired: false });
      });

      // Add expired goals (will overwrite if same ID exists)
      expiredGoals.forEach((goal: Goal) => {
        goalMap.set(goal.id, goal);
      });

      // Convert back to array
      const allGoals = Array.from(goalMap.values());

      if (type) {
        return allGoals.filter(goal => goal.type === type);
      }
      return allGoals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId: string, increment: number): Promise<Goal> {
    try {
      const goals = await getData('goals') || [];
      const index = goals.findIndex((goal: Goal) => goal.id === goalId);
      if (index !== -1) {
        goals[index].currentValue += increment;
        goals[index].progress = Math.min(100, (goals[index].currentValue / goals[index].targetValue) * 100);
        await storeData('goals', goals);
        return goals[index];
      }
      throw new Error('Goal not found');
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string): Promise<void> {
    try {
      const goals = await getData('goals') || [];
      const filtered = goals.filter((goal: Goal) => goal.id !== goalId);
      await storeData('goals', filtered);
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }

  /**
   * Get vision board items
   */
  async getVisionBoard(): Promise<Goal[]> {
    try {
      return await getData('goals') || [];
    } catch (error) {
      console.error('Error fetching vision board:', error);
      throw error;
    }
  }

  /**
   * Add image to vision board goal
   */
  async addVisionImage(goalId: string, imageUrl: string): Promise<Goal> {
    try {
      const goals = await getData('goals') || [];
      const index = goals.findIndex((goal: Goal) => goal.id === goalId);
      if (index !== -1) {
        goals[index].imageUrl = imageUrl;
        await storeData('goals', goals);
        return goals[index];
      }
      throw new Error('Goal not found');
    } catch (error) {
      console.error('Error adding vision image:', error);
      throw error;
    }
  }

  /**
   * Get today's tasks
   */
  async getTodaysTasks(): Promise<DailyTask[]> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      return await this.getDailyTasks(today);
    } catch (error) {
      console.error('Error fetching today\'s tasks:', error);
      return [];
    }
  }

  /**
   * Get tasks for current week
   */
  async getWeekTasks(): Promise<DailyTask[]> {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
      endOfWeek.setHours(23, 59, 59, 999);

      // This would require a new API endpoint for date range
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching week tasks:', error);
      return [];
    }
  }

  /**
   * Get habits that need completion today
   */
  async getPendingHabits(): Promise<Habit[]> {
    try {
      const habits = await this.getHabits();
      return habits.filter(habit => !habit.isCompletedToday);
    } catch (error) {
      console.error('Error fetching pending habits:', error);
      return [];
    }
  }

  /**
   * Get completed habits today
   */
  async getCompletedHabits(): Promise<Habit[]> {
    try {
      const habits = await this.getHabits();
      return habits.filter(habit => habit.isCompletedToday);
    } catch (error) {
      console.error('Error fetching completed habits:', error);
      return [];
    }
  }

  /**
   * Calculate habit streak for display
   */
  getHabitStreakText(habit: Habit): string {
    if (habit.currentStreak === 0) {
      return 'Start your streak!';
    }

    return `🔥 ${habit.currentStreak}-day streak`;
  }

  /**
   * Check if habit should be marked as completed today
   */
  shouldCompleteHabitToday(habit: Habit): boolean {
    // Check if habit was completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return habit.completedDates.some(date => {
      const habitDate = new Date(date);
      habitDate.setHours(0, 0, 0, 0);
      return habitDate.getTime() === today.getTime();
    });
  }

  /**
   * Get goal progress percentage
   */
  getGoalProgressPercentage(goal: Goal): number {
    return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
  }

  /**
   * Get goal progress text
   */
  getGoalProgressText(goal: Goal): string {
    return `${goal.currentValue}/${goal.targetValue} ${goal.unit}`;
  }

  /**
   * Check if goal is on track
   */
  isGoalOnTrack(goal: Goal): boolean {
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);

    if (now < startDate || now > endDate) {
      return false; // Goal not active
    }

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = now.getTime() - startDate.getTime();
    const expectedProgress = (elapsedDuration / totalDuration) * goal.targetValue;

    return goal.currentValue >= expectedProgress * 0.8; // 80% of expected progress
  }

  /**
   * Archive unfinished daily tasks (called on app start)
   */
  async archiveUnfinishedDailyTasks(): Promise<number> {
    try {
      const now = new Date();
      const today = now.toDateString();
      const storedTasks = await getData('tasks');

      if (!Array.isArray(storedTasks)) {
        console.log('No tasks found or invalid data format');
        return 0;
      }

      const tasks: DailyTask[] = storedTasks.filter((item): item is DailyTask => {
        return item &&
               typeof item === 'object' &&
               typeof item.id === 'string' &&
               typeof item.title === 'string' &&
               typeof item.date === 'string' &&
               typeof item.isCompleted === 'boolean';
      });

      const unfinished = tasks.filter((task: DailyTask) => {
        try {
          const taskDate = new Date(task.date);
          if (isNaN(taskDate.getTime())) {
            console.warn('Invalid task date:', task.date);
            return false;
          }
          const taskDateStr = taskDate.toDateString();
          return taskDateStr < today && !task.isCompleted;
        } catch (error) {
          console.warn('Error parsing task date:', task.date, error);
          return false;
        }
      });

      if (unfinished.length > 0) {
        const storedArchive = await getData('unfinished_tasks');
        const archive: (DailyTask & { archivedAt: string; period: string; originalDate: string })[] =
          Array.isArray(storedArchive) ? storedArchive.filter((item): item is (DailyTask & { archivedAt: string; period: string; originalDate: string }) => {
            return item &&
                   typeof item === 'object' &&
                   typeof item.id === 'string' &&
                   typeof item.title === 'string';
          }) : [];

        const archivedTasks = unfinished.map((task: DailyTask) => ({
          ...task,
          archivedAt: now.toISOString(),
          period: 'daily',
          originalDate: task.date,
        }));

        await storeData('unfinished_tasks', [...archive, ...archivedTasks]);

        // Remove from active tasks
        const remaining = tasks.filter((t: DailyTask) =>
          !unfinished.find((u: DailyTask) => u.id === t.id)
        );
        await storeData('tasks', remaining);
      }

      return unfinished.length;
    } catch (error) {
      console.error('Error archiving unfinished tasks:', error);
      console.log('Task archiving failed - this might be due to invalid data format or date issues');
      return 0;
    }
  }

  /**
   * Archive unfinished weekly goals (called on app start)
   */
  async archiveUnfinishedWeeklyGoals(): Promise<number> {
    try {
      const now = new Date();
      const storedGoals = await getData('goals');

      if (!Array.isArray(storedGoals)) {
        console.log('No goals found or invalid data format');
        return 0;
      }

      const goals: Goal[] = storedGoals.filter((item): item is Goal => {
        return item &&
               typeof item === 'object' &&
               typeof item.id === 'string' &&
               typeof item.title === 'string' &&
               typeof item.type === 'string' &&
               typeof item.endDate === 'string' &&
               typeof item.isCompleted === 'boolean';
      });

      const unfinished = goals.filter((goal: Goal) => {
        if (goal.type !== 'weekly') return false;

        try {
          const endDate = new Date(goal.endDate);
          if (isNaN(endDate.getTime())) {
            console.warn('Invalid goal end date:', goal.endDate);
            return false;
          }

          const isExpired = endDate < now;
          const isIncomplete = !goal.isCompleted && goal.currentValue < goal.targetValue;
          return isExpired && isIncomplete;
        } catch (error) {
          console.warn('Error parsing goal end date:', goal.endDate, error);
          return false;
        }
      });

      if (unfinished.length > 0) {
        const storedArchive = await getData('unfinished_goals');
        const archive: (Goal & { archivedAt: string; originalPeriod: string })[] =
          Array.isArray(storedArchive) ? storedArchive.filter((item): item is (Goal & { archivedAt: string; originalPeriod: string }) => {
            return item &&
                   typeof item === 'object' &&
                   typeof item.id === 'string' &&
                   typeof item.title === 'string';
          }) : [];

        const archivedGoals = unfinished.map((goal: Goal) => ({
          ...goal,
          archivedAt: now.toISOString(),
          originalPeriod: goal.type,
        }));

        await storeData('unfinished_goals', [...archive, ...archivedGoals]);

        // Remove from active goals
        const remaining = goals.filter((g: Goal) =>
          !unfinished.find((u: Goal) => u.id === g.id)
        );
        await storeData('goals', remaining);
      }

      return unfinished.length;
    } catch (error) {
      console.error('Error archiving unfinished weekly goals:', error);
      console.log('Weekly goals archiving failed - this might be due to invalid data format or date issues');
      return 0;
    }
  }

  /**
   * Archive unfinished yearly goals (called on app start)
   */
  async archiveUnfinishedYearlyGoals(): Promise<number> {
    try {
      const now = new Date();
      const storedGoals = await getData('goals');

      if (!Array.isArray(storedGoals)) {
        console.log('No goals found or invalid data format');
        return 0;
      }

      const goals: Goal[] = storedGoals.filter((item): item is Goal => {
        return item &&
               typeof item === 'object' &&
               typeof item.id === 'string' &&
               typeof item.title === 'string' &&
               typeof item.type === 'string' &&
               typeof item.endDate === 'string' &&
               typeof item.isCompleted === 'boolean';
      });

      const unfinished = goals.filter((goal: Goal) => {
        if (goal.type !== 'yearly') return false;

        try {
          const endDate = new Date(goal.endDate);
          if (isNaN(endDate.getTime())) {
            console.warn('Invalid goal end date:', goal.endDate);
            return false;
          }

          const isExpired = endDate < now;
          const isIncomplete = !goal.isCompleted && goal.currentValue < goal.targetValue;
          return isExpired && isIncomplete;
        } catch (error) {
          console.warn('Error parsing goal end date:', goal.endDate, error);
          return false;
        }
      });

      if (unfinished.length > 0) {
        const storedArchive = await getData('unfinished_goals');
        const archive: (Goal & { archivedAt: string; originalPeriod: string })[] =
          Array.isArray(storedArchive) ? storedArchive.filter((item): item is (Goal & { archivedAt: string; originalPeriod: string }) => {
            return item &&
                   typeof item === 'object' &&
                   typeof item.id === 'string' &&
                   typeof item.title === 'string';
          }) : [];

        const archivedGoals = unfinished.map((goal: Goal) => ({
          ...goal,
          archivedAt: now.toISOString(),
          originalPeriod: goal.type,
        }));

        await storeData('unfinished_goals', [...archive, ...archivedGoals]);

        // Remove from active goals
        const remaining = goals.filter((g: Goal) =>
          !unfinished.find((u: Goal) => u.id === g.id)
        );
        await storeData('goals', remaining);
      }

      return unfinished.length;
    } catch (error) {
      console.error('Error archiving unfinished yearly goals:', error);
      console.log('Yearly goals archiving failed - this might be due to invalid data format or date issues');
      return 0;
    }
  }

  /**
   * Archive all unfinished items (comprehensive method)
   */
  async archiveAllUnfinishedItems(): Promise<{ tasks: number; weeklyGoals: number; yearlyGoals: number }> {
    const results = {
      tasks: await this.archiveUnfinishedDailyTasks(),
      weeklyGoals: await this.archiveUnfinishedWeeklyGoals(),
      yearlyGoals: await this.archiveUnfinishedYearlyGoals(),
    };
    return results;
  }

  /**
   * Restore a task from unfinished back to active
   */
  async restoreTask(taskId: string): Promise<DailyTask> {
    try {
      const unfinished = await this.getUnfinishedTasks();
      const taskIndex = unfinished.findIndex(t => t.id === taskId);

      if (taskIndex === -1) {
        throw new Error('Task not found in unfinished items');
      }

      const task = unfinished[taskIndex];

      // Add back to active tasks with today's date
      const activeTasks = (await getData('tasks')) as DailyTask[] | null || [];
      const restoredTask = {
        ...task,
        date: new Date().toISOString().split('T')[0],
        completedAt: null,
        isCompleted: false,
      };

      await storeData('tasks', [...activeTasks, restoredTask]);

      // Remove from unfinished
      const remaining = unfinished.filter(t => t.id !== taskId);
      await storeData('unfinished_tasks', remaining);

      return restoredTask;
    } catch (error) {
      console.error('Error restoring task:', error);
      throw error;
    }
  }

  /**
   * Restore a goal from unfinished back to active
   */
  async restoreGoal(goalId: string): Promise<Goal> {
    try {
      const unfinished = await this.getUnfinishedGoals();
      const goalIndex = unfinished.findIndex(g => g.id === goalId);

      if (goalIndex === -1) {
        throw new Error('Goal not found in unfinished items');
      }

      const goal = unfinished[goalIndex];

      // Add back to active goals with appropriate new dates
      const activeGoals = (await getData('goals')) as Goal[] | null || [];
      const now = new Date();

      let newEndDate: string;
      if (goal.type === 'weekly') {
        // Set to next week
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + (7 - now.getDay()));
        newEndDate = nextWeek.toISOString();
      } else if (goal.type === 'yearly') {
        // Set to next year
        const nextYear = new Date(now);
        nextYear.setFullYear(now.getFullYear() + 1);
        newEndDate = nextYear.toISOString();
      } else {
        newEndDate = goal.endDate;
      }

      const restoredGoal = {
        ...goal,
        endDate: newEndDate,
        isCompleted: false,
        currentValue: 0,
        progress: 0,
      };

      await storeData('goals', [...activeGoals, restoredGoal]);

      // Remove from unfinished
      const remaining = unfinished.filter(g => g.id !== goalId);
      await storeData('unfinished_goals', remaining);

      return restoredGoal;
    } catch (error) {
      console.error('Error restoring goal:', error);
      throw error;
    }
  }

  /**
   * Permanently delete an unfinished task
   */
  async deleteUnfinishedTask(taskId: string): Promise<void> {
    try {
      console.log('Attempting to delete unfinished task:', taskId);
      const unfinished = await this.getUnfinishedTasks();
      console.log('Found unfinished tasks:', unfinished.length);

      const taskToDelete = unfinished.find(t => t.id === taskId);
      if (!taskToDelete) {
        console.warn('Task not found in unfinished items:', taskId);
        throw new Error('Task not found');
      }

      console.log('Deleting task:', taskToDelete.title);
      const remaining = unfinished.filter(t => t.id !== taskId);
      console.log('Remaining tasks after delete:', remaining.length);

      await storeData('unfinished_tasks', remaining);
      console.log('Task deleted successfully');

      // Verify the delete worked
      const verify = await this.getUnfinishedTasks();
      console.log('Verification - remaining tasks after delete:', verify.length);

    } catch (error) {
      console.error('Error deleting unfinished task:', error);
      throw error;
    }
  }

  /**
   * Permanently delete an unfinished goal
   */
  async deleteUnfinishedGoal(goalId: string): Promise<void> {
    try {
      console.log('Attempting to delete unfinished goal:', goalId);
      const unfinished = await this.getUnfinishedGoals();
      console.log('Found unfinished goals:', unfinished.length);

      const goalToDelete = unfinished.find(g => g.id === goalId);
      if (!goalToDelete) {
        console.warn('Goal not found in unfinished items:', goalId);
        throw new Error('Goal not found');
      }

      console.log('Deleting goal:', goalToDelete.title);
      const remaining = unfinished.filter(g => g.id !== goalId);
      console.log('Remaining goals after delete:', remaining.length);

      await storeData('unfinished_goals', remaining);
      console.log('Goal deleted successfully');

      // Verify the delete worked
      const verify = await this.getUnfinishedGoals();
      console.log('Verification - remaining goals after delete:', verify.length);

    } catch (error) {
      console.error('Error deleting unfinished goal:', error);
      throw error;
    }
  }

  /**
   * Get unfinished goals
   */
  async getUnfinishedGoals(): Promise<(Goal & { archivedAt: string; originalPeriod: string })[]> {
    try {
      const stored = await getData('unfinished_goals');

      if (!Array.isArray(stored)) {
        console.log('No unfinished goals found or invalid data format');
        return [];
      }

      const validGoals = stored.filter((item): item is (Goal & { archivedAt: string; originalPeriod: string }) => {
        return item &&
               typeof item === 'object' &&
               typeof item.id === 'string' &&
               typeof item.title === 'string' &&
               typeof item.type === 'string' &&
               typeof item.archivedAt === 'string' &&
               typeof item.originalPeriod === 'string';
      });

      return validGoals;
    } catch (error) {
      console.error('Error fetching unfinished goals:', error);
      return [];
    }
  }

  /**
   * Calculate days since last completion for missed days indicator
   */
  getDaysSinceLastCompletion(lastCompletedDate: string | null): number {
    if (!lastCompletedDate) return 0;
    
    const now = new Date();
    const lastDate = new Date(lastCompletedDate);
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get motivational message for goal
   */
  getGoalMotivation(goal: Goal): string {
    if (goal.isCompleted) {
      return '🎉 Goal completed! Amazing work!';
    }

    if (goal.progress >= 90) {
      return '🚀 Almost there! You\'re crushing this goal!';
    }

    if (goal.progress >= 75) {
      return '💪 Great progress! Keep up the momentum!';
    }

    if (goal.progress >= 50) {
      return '🔥 You\'re halfway there! Keep going!';
    }

    if (goal.progress >= 25) {
      return '🌟 Good start! You\'ve got this!';
    }

    return '🎯 Every journey begins with a single step!';
  }

  /**
   * Create sample unfinished data for testing (development only)
   */
  async createSampleUnfinishedData(): Promise<void> {
    if (!__DEV__) return; // Only run in development

    console.log('Creating sample unfinished data for testing...');

    // Create sample unfinished tasks
    const sampleTasks = [
      {
        id: 'sample-task-1',
        title: 'Sample Task 1',
        description: 'This is a sample unfinished task for testing delete functionality',
        date: '2023-10-24', // Yesterday's date
        userId: 'local',
        isCompleted: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archivedAt: new Date().toISOString(),
        period: 'daily',
        originalDate: '2023-10-24'
      },
      {
        id: 'sample-task-2',
        title: 'Sample Task 2',
        description: 'Another sample task for testing',
        date: '2023-10-23',
        userId: 'local',
        isCompleted: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archivedAt: new Date().toISOString(),
        period: 'daily',
        originalDate: '2023-10-23'
      }
    ];

    // Create sample unfinished goals
    const sampleGoals = [
      {
        id: 'sample-goal-1',
        title: 'Sample Weekly Goal',
        description: 'Sample weekly goal for testing delete functionality',
        type: 'weekly' as const,
        targetValue: 100,
        currentValue: 45,
        unit: 'points',
        startDate: '2023-10-16',
        endDate: '2023-10-22', // Last week
        userId: 'local',
        isCompleted: false,
        progress: 45,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archivedAt: new Date().toISOString(),
        originalPeriod: 'weekly'
      },
      {
        id: 'sample-goal-2',
        title: 'Sample Yearly Goal',
        description: 'Sample yearly goal for testing',
        type: 'yearly' as const,
        targetValue: 1000,
        currentValue: 234,
        unit: 'hours',
        startDate: '2023-01-01',
        endDate: '2023-12-31', // This year
        userId: 'local',
        isCompleted: false,
        progress: 23.4,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archivedAt: new Date().toISOString(),
        originalPeriod: 'yearly'
      }
    ];

    await storeData('unfinished_tasks', sampleTasks);
    await storeData('unfinished_goals', sampleGoals);
    console.log('Sample data created successfully');
  }
}

// Create and export singleton instance
const taskService = new TaskService();

export default taskService;
export { taskService };
