/**
 * Task Service
 *
 * Handles daily tasks, habits, and goals management
 * Integrates with backend API for task and goal operations
 * Provides React-friendly interfaces for task tracking
 */

import { taskAPI } from './api';

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
      const response = await taskAPI.createHabit(habitData);

      if (response.success) {
        return response.data.habit;
      }

      throw new Error(response.error || 'Failed to create habit');
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
      const response = await taskAPI.getHabits();

      if (response.success) {
        return response.data.habits;
      }

      throw new Error(response.error || 'Failed to fetch habits');
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
      const response = await taskAPI.completeHabit(habitId);

      if (response.success) {
        return response.data.habit;
      }

      throw new Error(response.error || 'Failed to complete habit');
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
      const response = await taskAPI.deleteHabit(habitId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete habit');
      }
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
      const response = await taskAPI.createDailyTask(taskData);

      if (response.success) {
        return response.data.task;
      }

      throw new Error(response.error || 'Failed to create daily task');
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
      const response = await taskAPI.getDailyTasks(date);

      if (response.success) {
        return response.data.tasks;
      }

      throw new Error(response.error || 'Failed to fetch daily tasks');
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
      const response = await taskAPI.toggleTask(taskId);

      if (response.success) {
        return response.data.task;
      }

      throw new Error(response.error || 'Failed to toggle task completion');
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
      const response = await taskAPI.deleteDailyTask(taskId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete daily task');
      }
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
      const response = await taskAPI.createGoal(goalData);

      if (response.success) {
        return response.data.goal;
      }

      throw new Error(response.error || 'Failed to create goal');
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
      const response = await taskAPI.getGoals(type);

      if (response.success) {
        return response.data.goals;
      }

      throw new Error(response.error || 'Failed to fetch goals');
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
      const response = await taskAPI.updateGoalProgress(goalId, increment);

      if (response.success) {
        return response.data.goal;
      }

      throw new Error(response.error || 'Failed to update goal progress');
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
      const response = await taskAPI.deleteGoal(goalId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete goal');
      }
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
      const response = await taskAPI.getVisionBoard();

      if (response.success) {
        return response.data.visionBoard;
      }

      throw new Error(response.error || 'Failed to fetch vision board');
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
      const response = await taskAPI.addVisionImage(goalId, imageUrl);

      if (response.success) {
        return response.data.goal;
      }

      throw new Error(response.error || 'Failed to add vision image');
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
