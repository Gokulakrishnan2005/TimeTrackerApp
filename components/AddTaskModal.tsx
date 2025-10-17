/**
 * Add Task Modal
 *
 * Modal for adding new habits, tasks, and goals
 * Provides different forms based on the type selected
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { taskService } from '../services/taskService';
import { colors } from '../constants/colors';
import { spacing, typography, radii } from '../constants/theme';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onItemAdded: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  onItemAdded,
}) => {
  const [currentStep, setCurrentStep] = useState<'type' | 'habit' | 'task' | 'goal'>('type');
  const [formData, setFormData] = useState({
    habitName: '',
    habitIcon: '⭐',
    taskTitle: '',
    taskDescription: '',
    goalType: 'weekly' as 'weekly' | 'monthly' | 'yearly',
    goalTitle: '',
    goalDescription: '',
    goalTarget: '',
    goalUnit: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      habitName: '',
      habitIcon: '⭐',
      taskTitle: '',
      taskDescription: '',
      goalType: 'weekly',
      goalTitle: '',
      goalDescription: '',
      goalTarget: '',
      goalUnit: '',
    });
    setCurrentStep('type');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTypeSelect = (type: 'habit' | 'task' | 'goal') => {
    setCurrentStep(type);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (currentStep === 'habit') {
        if (!formData.habitName.trim()) {
          Alert.alert('Error', 'Please enter a habit name');
          return;
        }

        await taskService.createHabit({
          name: formData.habitName.trim(),
          icon: formData.habitIcon,
        });

        Alert.alert('Success', 'Habit created successfully!');

      } else if (currentStep === 'task') {
        if (!formData.taskTitle.trim()) {
          Alert.alert('Error', 'Please enter a task title');
          return;
        }

        await taskService.createDailyTask({
          title: formData.taskTitle.trim(),
          description: formData.taskDescription.trim(),
        });

        Alert.alert('Success', 'Task created successfully!');

      } else if (currentStep === 'goal') {
        if (!formData.goalTitle.trim() || !formData.goalTarget || !formData.goalUnit.trim()) {
          Alert.alert('Error', 'Please fill in all required fields');
          return;
        }

        const startDate = new Date();
        const endDate = new Date();

        if (formData.goalType === 'weekly') {
          endDate.setDate(startDate.getDate() + 7);
        } else if (formData.goalType === 'monthly') {
          endDate.setMonth(startDate.getMonth() + 1);
        } else if (formData.goalType === 'yearly') {
          endDate.setFullYear(startDate.getFullYear() + 1);
        }

        await taskService.createGoal({
          type: formData.goalType,
          title: formData.goalTitle.trim(),
          description: formData.goalDescription.trim(),
          targetValue: parseInt(formData.goalTarget),
          unit: formData.goalUnit.trim(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        Alert.alert('Success', 'Goal created successfully!');
      }

      onItemAdded();
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create item');
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {currentStep === 'type' ? 'Add New Item' : `Add ${currentStep === 'habit' ? 'Habit' : currentStep === 'task' ? 'Task' : 'Goal'}`}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Type Selection Step */}
          {currentStep === 'type' && (
            <View style={styles.typeSelection}>
              <TouchableOpacity
                style={[styles.typeButton, styles.habitButton]}
                onPress={() => handleTypeSelect('habit')}
              >
                <Text style={styles.typeIcon}>📋</Text>
                <Text style={styles.typeTitle}>Daily Habit</Text>
                <Text style={styles.typeSubtitle}>Build consistency with streaks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, styles.taskButton]}
                onPress={() => handleTypeSelect('task')}
              >
                <Text style={styles.typeIcon}>✅</Text>
                <Text style={styles.typeTitle}>Daily Task</Text>
                <Text style={styles.typeSubtitle}>One-off tasks for today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, styles.goalButton]}
                onPress={() => handleTypeSelect('goal')}
              >
                <Text style={styles.typeIcon}>🎯</Text>
                <Text style={styles.typeTitle}>Goal</Text>
                <Text style={styles.typeSubtitle}>Weekly, monthly, or yearly targets</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Habit Form Step */}
          {currentStep === 'habit' && (
            <HabitForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}

          {/* Task Form Step */}
          {currentStep === 'task' && (
            <TaskForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}

          {/* Goal Form Step */}
          {currentStep === 'goal' && (
            <GoalForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// Habit Form Component
const HabitForm: React.FC<{
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
}> = ({ formData, setFormData, onSubmit, isLoading }) => (
  <View style={styles.form}>
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Habit Name</Text>
      <TextInput
        style={styles.input}
        value={formData.habitName}
        onChangeText={(habitName) => setFormData({ ...formData, habitName })}
        placeholder="e.g., Drink Water, Exercise"
        placeholderTextColor={colors.textSecondary}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Icon (Optional)</Text>
      <TextInput
        style={styles.input}
        value={formData.habitIcon}
        onChangeText={(habitIcon) => setFormData({ ...formData, habitIcon })}
        placeholder="⭐"
        maxLength={2}
        placeholderTextColor={colors.textSecondary}
      />
    </View>

    <TouchableOpacity
      style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
      onPress={onSubmit}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <Text style={styles.submitButtonText}>Create Habit</Text>
      )}
    </TouchableOpacity>
  </View>
);

// Task Form Component
const TaskForm: React.FC<{
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
}> = ({ formData, setFormData, onSubmit, isLoading }) => (
  <View style={styles.form}>
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Task Title</Text>
      <TextInput
        style={styles.input}
        value={formData.taskTitle}
        onChangeText={(taskTitle) => setFormData({ ...formData, taskTitle })}
        placeholder="What needs to be done?"
        placeholderTextColor={colors.textSecondary}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Description (Optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.taskDescription}
        onChangeText={(taskDescription) => setFormData({ ...formData, taskDescription })}
        placeholder="Add more details..."
        multiline
        numberOfLines={3}
        placeholderTextColor={colors.textSecondary}
      />
    </View>

    <TouchableOpacity
      style={[styles.submitButton, styles.taskSubmitButton, isLoading && styles.submitButtonDisabled]}
      onPress={onSubmit}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <Text style={styles.submitButtonText}>Create Task</Text>
      )}
    </TouchableOpacity>
  </View>
);

// Goal Form Component
const GoalForm: React.FC<{
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
}> = ({ formData, setFormData, onSubmit, isLoading }) => (
  <View style={styles.form}>
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Goal Type</Text>
      <View style={styles.typeSelector}>
        {['weekly', 'monthly', 'yearly'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeChip,
              formData.goalType === type && styles.typeChipSelected,
            ]}
            onPress={() => setFormData({ ...formData, goalType: type as 'weekly' | 'monthly' | 'yearly' })}
          >
            <Text style={[
              styles.typeChipText,
              formData.goalType === type && styles.typeChipTextSelected,
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Goal Title</Text>
      <TextInput
        style={styles.input}
        value={formData.goalTitle}
        onChangeText={(goalTitle) => setFormData({ ...formData, goalTitle })}
        placeholder="e.g., Read 12 books, Run 100km"
        placeholderTextColor={colors.textSecondary}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Target Value</Text>
      <TextInput
        style={styles.input}
        value={formData.goalTarget}
        onChangeText={(goalTarget) => setFormData({ ...formData, goalTarget })}
        placeholder="12"
        keyboardType="numeric"
        placeholderTextColor={colors.textSecondary}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Unit</Text>
      <TextInput
        style={styles.input}
        value={formData.goalUnit}
        onChangeText={(goalUnit) => setFormData({ ...formData, goalUnit })}
        placeholder="e.g., books, km, hours"
        placeholderTextColor={colors.textSecondary}
      />
    </View>

    <TouchableOpacity
      style={[styles.submitButton, styles.goalSubmitButton, isLoading && styles.submitButtonDisabled]}
      onPress={onSubmit}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <Text style={styles.submitButtonText}>Create Goal</Text>
      )}
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    minHeight: '50%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  typeSelection: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  typeButton: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  habitButton: {
    backgroundColor: '#8B5CF6',
  },
  taskButton: {
    backgroundColor: '#06B6D4',
  },
  goalButton: {
    backgroundColor: '#10B981',
  },
  typeIcon: {
    fontSize: 32,
  },
  typeTitle: {
    ...typography.heading,
    color: colors.surface,
    fontWeight: '700',
  },
  typeSubtitle: {
    ...typography.body,
    color: colors.surface,
    opacity: 0.9,
  },
  form: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    ...typography.body,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  typeChipTextSelected: {
    color: colors.surface,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  taskSubmitButton: {
    backgroundColor: '#06B6D4',
  },
  goalSubmitButton: {
    backgroundColor: '#10B981',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...typography.heading,
    color: colors.surface,
    fontWeight: '700',
  },
});

export default AddTaskModal;
