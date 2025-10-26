/**
 * Add Transaction Modal
 *
 * Modal for adding income or expense transactions
 * Shows type selection first, then appropriate form
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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { financeService } from '../services/financeService';
import { colors } from '../constants/colors';
import { spacing, typography, radii } from '../constants/theme';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
  defaultType?: 'income' | 'expense';
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  onTransactionAdded,
  defaultType,
}) => {
  const [currentStep, setCurrentStep] = useState<'type' | 'income' | 'expense'>('type');
  const [formData, setFormData] = useState({
    type: '' as 'income' | 'expense' | '',
    amount: '',
    category: '',
    notes: '',
    customCategory: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const categories = financeService.getCategories();

  const resetForm = () => {
    setFormData({
      type: '',
      amount: '',
      category: '',
      notes: '',
      customCategory: '',
    });
    setCurrentStep('type');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTypeSelect = (type: 'income' | 'expense') => {
    setFormData(prev => ({ ...prev, type }));
    setCurrentStep(type);
  };

  // When opened with a defaultType, jump straight to that flow
  React.useEffect(() => {
    if (visible) {
      if (defaultType === 'income' || defaultType === 'expense') {
        setFormData(prev => ({ ...prev, type: defaultType! }));
        setCurrentStep(defaultType!);
      } else {
        setCurrentStep('type');
      }
    }
  }, [visible, defaultType]);

  const handleSubmit = async () => {
    if (!formData.amount || !formData.category || !formData.type) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.category === 'Other' && !formData.customCategory.trim()) {
      Alert.alert('Tell us the source/category', 'Please specify a name for "Other". For example: Bonus, Gift, Tips, Fuel, Travel, etc.');
      return;
    }

    setIsLoading(true);
    try {
      await financeService.addTransaction({
        type: formData.type as 'income' | 'expense',
        amount: parseFloat(formData.amount),
        category: formData.category,
        customCategory: formData.category === 'Other' ? formData.customCategory.trim() : undefined,
        notes: formData.notes,
      });

      Alert.alert('Success', `${formData.type === 'income' ? 'Income' : 'Expense'} added successfully`);
      onTransactionAdded();
      handleClose();
    } catch (error: any) {
      const friendly =
        (error && (error.message || error?.details?.error)) ||
        'Cannot reach server. Please ensure the backend is running and your device can access it.';
      Alert.alert('Error', friendly);
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
              {currentStep === 'type' ? 'Choose Type' : `Add ${formData.type === 'income' ? 'Income' : 'Expense'}`}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Type Selection Step */}
          {currentStep === 'type' && (
            <View style={styles.typeSelection}>
              <View style={styles.typeButtonRow}>
                <TouchableOpacity
                  style={[styles.typeButton, styles.incomeButton]}
                  onPress={() => handleTypeSelect('income')}
                >
                  <Text style={styles.typeIcon}>↑</Text>
                  <Text style={styles.typeTitle}>Income</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeButton, styles.expenseButton]}
                  onPress={() => handleTypeSelect('expense')}
                >
                  <Text style={styles.typeTitle}>Expense</Text>
                  <Text style={styles.typeIcon}>↓</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Income Form Step */}
          {currentStep === 'income' && (
            <IncomeForm
              formData={formData}
              setFormData={setFormData}
              categories={categories.income}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}

          {/* Expense Form Step */}
          {currentStep === 'expense' && (
            <ExpenseForm
              formData={formData}
              setFormData={setFormData}
              categories={categories.expenses}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// Income Form Component
const IncomeForm: React.FC<{
  formData: any;
  setFormData: (data: any) => void;
  categories: string[];
  onSubmit: () => void;
  isLoading: boolean;
}> = ({ formData, setFormData, categories, onSubmit, isLoading }) => {
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.form}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Source</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={[styles.dropdownText, !formData.category && styles.dropdownPlaceholder]}>
              {formData.category || 'e.g., Salary, Freelance'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          
          {showCategoryPicker && (
            <View style={styles.categoryDropdown}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.categoryOption}
                    onPress={() => {
                      setFormData({
                        ...formData,
                        category,
                        customCategory: category === 'Other' ? formData.customCategory : ''
                      });
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={styles.categoryOptionText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {formData.category === 'Other' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Specify Source</Text>
            <TextInput
              style={styles.input}
              value={formData.customCategory}
              onChangeText={(customCategory) => setFormData({ ...formData, customCategory })}
              placeholder="e.g., Bonus, Gift, Rental Income"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={formData.amount}
              onChangeText={(amount) => setFormData({ ...formData, amount })}
              placeholder="- - - - - -"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(notes) => setFormData({ ...formData, notes })}
            placeholder="How did you Get it?"
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, styles.incomeSubmitButton, isLoading && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Adding...' : 'Add Income'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Expense Form Component
const ExpenseForm: React.FC<{
  formData: any;
  setFormData: (data: any) => void;
  categories: string[];
  onSubmit: () => void;
  isLoading: boolean;
}> = ({ formData, setFormData, categories, onSubmit, isLoading }) => {
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.form}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={[styles.dropdownText, !formData.category && styles.dropdownPlaceholder]}>
              {formData.category || 'e.g., Rent, Food'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          
          {showCategoryPicker && (
            <View style={styles.categoryDropdown}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.categoryOption}
                    onPress={() => {
                      setFormData({
                        ...formData,
                        category,
                        customCategory: category === 'Other' ? formData.customCategory : ''
                      });
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={styles.categoryOptionText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {formData.category === 'Other' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Specify Source</Text>
            <TextInput
              style={styles.input}
              value={formData.customCategory}
              onChangeText={(customCategory) => setFormData({ ...formData, customCategory })}
              placeholder="e.g., Travel, Fuel, Groceries"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={formData.amount}
              onChangeText={(amount) => setFormData({ ...formData, amount })}
              placeholder="- - - - - -"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(notes) => setFormData({ ...formData, notes })}
            placeholder="Why did you Spend it?"
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, styles.expenseSubmitButton, isLoading && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Adding...' : 'Add Expense'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

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
    minHeight: '60%',
    maxHeight: '90%',
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
    padding: spacing.xl * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeButtonRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    width: '100%',
    justifyContent: 'center',
  },
  typeButton: {
    flex: 1,
    maxWidth: 160,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    elevation: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
  },
  incomeButton: {
    backgroundColor: '#7FB7A7',
  },
  expenseButton: {
    backgroundColor: '#D8847B',
  },
  typeIcon: {
    fontSize: 18,
    color: colors.surface,
    fontWeight: 'bold',
  },
  typeTitle: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
    fontSize: 16,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  categoryChipTextSelected: {
    color: colors.surface,
    fontWeight: '600',
  },
  // Dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  dropdownText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: colors.textTertiary,
  },
  dropdownIcon: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  categoryDropdown: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    maxHeight: 280,
    elevation: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  categoryOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryOptionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  // Amount input styles
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  currencySymbol: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginRight: spacing.sm,
    fontSize: 16,
  },
  amountInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 16,
    padding: 0,
  },
  submitButton: {
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    elevation: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
  },
  incomeSubmitButton: {
    backgroundColor: '#7FB7A7',
  },
  expenseSubmitButton: {
    backgroundColor: '#D8847B',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.heading,
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default AddTransactionModal;
