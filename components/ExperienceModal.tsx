import { FC, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../constants/colors";
import { radii, spacing, typography } from "../constants/theme";

export interface ExperienceModalProps {
  visible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving?: boolean;
  title?: string;
  subtitle?: string;
  saveLabel?: string;
}

export const ExperienceModal: FC<ExperienceModalProps> = ({
  visible,
  value,
  onChangeText,
  onCancel,
  onSave,
  isSaving = false,
  title,
  subtitle,
  saveLabel,
}) => {
  const [renderModal, setRenderModal] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const resolvedTitle = title ?? "Record Your Session";
  const resolvedSubtitle =
    subtitle ?? "What did you work on? How did it go? Capture your thoughts and insights.";
  const resolvedSaveLabel = saveLabel ?? "Save Notes";

  useEffect(() => {
    if (visible) {
      setRenderModal(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 18,
          stiffness: 180,
          useNativeDriver: false,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 180,
          useNativeDriver: false,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: 40,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setRenderModal(false);
      }
    });
  }, [backdropOpacity, scale, translateY, visible]);

  if (!renderModal) {
    return null;
  }

  return (
    <Modal transparent visible animationType="none" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable style={styles.flex} onPress={onCancel} />
        </Animated.View>

        <View style={[styles.centerContent, { pointerEvents: 'box-none' }]}>
          <Animated.View
            style={[styles.card, { transform: [{ scale }, { translateY }] }]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.title}>{resolvedTitle}</Text>
              <Text style={styles.subtitle}>{resolvedSubtitle}</Text>

              <TextInput
                value={value}
                onChangeText={onChangeText}
                multiline
                autoFocus
                placeholder="What did you accomplish? Any insights or challenges?"
                placeholderTextColor={colors.textSecondary}
                textAlignVertical="top"
                style={styles.textInput}
                maxLength={1000}
              />

              <View style={styles.buttonRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    styles.cancelButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={onCancel}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    styles.saveButton,
                    (pressed || isSaving) && styles.buttonPressed,
                    isSaving && styles.buttonDisabled,
                  ]}
                  onPress={onSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.saveText}>{resolvedSaveLabel}</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.lg,
    boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.12)',
    elevation: 12,
  },
  scrollContent: {
    gap: spacing.lg,
  },
  title: {
    ...typography.heading,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  textInput: {
    minHeight: 140,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: "rgba(59, 89, 152, 0.15)",
    padding: spacing.md,
    backgroundColor: colors.background,
    ...typography.body,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: radii.pill,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 56,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    boxShadow: `0px 6px 12px ${colors.primary}35`,
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },
});
