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
  description: string;
  isCompleted: boolean;
  date: string;
  completedAt: string | null;
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
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  progress: number;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  imageUrl: string | null;
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
      const habits = await getData('habits') || [];
      const newHabit = { ...habitData, id: Date.now().toString(), userId: 'local', currentStreak: 0, longestStreak: 0, completedDates: [], isCompletedToday: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await storeData('habits', [...habits, newHabit]);
      return newHabit;
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
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
      const habits = await getData('habits') || [];
      const index = habits.findIndex(habit => habit.id === habitId);
      if (index !== -1) {
        habits[index].isCompletedToday = true;
        habits[index].completedDates.push(new Date().toISOString());
        habits[index].currentStreak++;
        await storeData('habits', habits);
        return habits[index];
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
      const filtered = habits.filter(habit => habit.id !== habitId);
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
      const newTask = { ...taskData, id: Date.now().toString(), userId: 'local', isCompleted: false, completedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await storeData('tasks', [...tasks, newTask]);
      return newTask;
    } catch (error) {
      console.error('Error creating daily task:', error);
      throw error;
    }
  }

  /**
   * Get daily tasks for a specific date
   */
  async getDailyTasks(date?: string): Promise<DailyTask[]> {
    try {
      const tasks = await getData('tasks') || [];
      if (date) {
        return tasks.filter(task => task.date === date);
      }
      return tasks;
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
      const tasks = await getData('tasks') || [];
      const index = tasks.findIndex(task => task.id === taskId);
      if (index !== -1) {
        tasks[index].isCompleted = !tasks[index].isCompleted;
        if (tasks[index].isCompleted) {
          tasks[index].completedAt = new Date().toISOString();
        } else {
          tasks[index].completedAt = null;
        }
        await storeData('tasks', tasks);
        return tasks[index];
      }
      throw new Error('Task not found');
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  }

  /**
   * Delete a daily task
   */
  async deleteDailyTask(taskId: string): Promise<void> {
    try {
      const tasks = await getData('tasks') || [];
      const filtered = tasks.filter(task => task.id !== taskId);
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
      const newGoal = { ...goalData, id: Date.now().toString(), userId: 'local', currentValue: 0, progress: 0, isCompleted: false, imageUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await storeData('goals', [...goals, newGoal]);
      return newGoal;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  /**
   * Get goals by type
   */
  async getGoals(type?: string): Promise<Goal[]> {
    try {
      const goals = await getData('goals') || [];
      if (type) {
        return goals.filter(goal => goal.type === type);
      }
      return goals;
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
      const index = goals.findIndex(goal => goal.id === goalId);
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
      const filtered = goals.filter(goal => goal.id !== goalId);
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
      const index = goals.findIndex(goal => goal.id === goalId);
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
}

// Create and export singleton instance
const taskService = new TaskService();

export default taskService;
export { taskService };
