import React, { FC, useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors } from "../constants/colors";
import { radii, spacing, typography } from "../constants/theme";
import {
  SESSION_TAGS,
  resolveTagColor,
  resolveTagLabel,
} from "../constants/sessionTags";

export type TagModalMode = "start" | "stop";

interface TagSelectionModalProps {
  visible: boolean;
  initialTag?: string | null;
  mode?: TagModalMode;
  onConfirm: (tag: string | null) => void;
  onSkip: () => void;
  onClose: () => void;
}

interface TagOption {
  id: string;
  label: string;
  color: string;
}

const normalizeTag = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const TagSelectionModal: FC<TagSelectionModalProps> = ({
  visible,
  initialTag = null,
  mode = "start",
  onConfirm,
  onSkip,
  onClose,
}) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isCustomEnabled, setCustomEnabled] = useState(false);
  const [customTag, setCustomTag] = useState("");

  const tagOptions: TagOption[] = useMemo(
    () =>
      SESSION_TAGS.map((tag) => ({
        id: tag.id,
        label: tag.label,
        color: tag.color,
      })),
    []
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    const normalizedInitial = normalizeTag(initialTag);
    setSelectedTag(normalizedInitial);
    const matchesPredefined = normalizedInitial
      ? SESSION_TAGS.some((tag) => tag.id === normalizedInitial.toLowerCase())
      : false;
    setCustomEnabled(Boolean(normalizedInitial && !matchesPredefined));
    setCustomTag(normalizedInitial && !matchesPredefined ? normalizedInitial : "");
  }, [initialTag, visible]);

  const handleSelectTag = (tagId: string) => {
    if (selectedTag === tagId) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tagId);
      setCustomEnabled(false);
      setCustomTag("");
    }
  };

  const handleConfirm = () => {
    if (isCustomEnabled) {
      const normalized = normalizeTag(customTag);
      onConfirm(normalized);
      return;
    }
    if (!selectedTag) {
      onConfirm(null);
      return;
    }
    const defined = SESSION_TAGS.find((tag) => tag.id === selectedTag);
    onConfirm(defined ? defined.id : selectedTag);
  };

  const title = mode === "start" ? "What are you working on?" : "Tag your session";
  const subtitle =
    mode === "start"
      ? "Select a focus area for this session. You can skip if you prefer."
      : "Add a tag so you can analyze this session later.";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagRow}
          >
            {tagOptions.map((tag) => {
              const isSelected = !isCustomEnabled && selectedTag === tag.id;
              return (
                <Pressable
                  key={tag.id}
                  style={({ pressed }) => [
                    styles.chip,
                    { borderColor: tag.color },
                    isSelected && { backgroundColor: tag.color },
                    pressed && styles.chipPressed,
                  ]}
                  onPress={() => handleSelectTag(tag.id)}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      isSelected && { color: colors.surface },
                      !isSelected && { color: tag.color },
                    ]}
                  >
                    {tag.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              style={({ pressed }) => [
                styles.chip,
                styles.customChip,
                pressed && styles.chipPressed,
                isCustomEnabled && styles.customChipActive,
              ]}
              onPress={() => {
                setSelectedTag(null);
                setCustomEnabled(true);
              }}
            >
              <Text
                style={[
                  styles.chipLabel,
                  isCustomEnabled ? styles.customChipActiveLabel : styles.customChipLabel,
                ]}
              >
                + Add Custom Tag
              </Text>
            </Pressable>
          </ScrollView>

          {isCustomEnabled ? (
            <TextInput
              value={customTag}
              onChangeText={setCustomTag}
              placeholder="Custom tag name"
              placeholderTextColor={colors.textSecondary}
              style={styles.textInput}
              maxLength={40}
            />
          ) : null}

          <View style={styles.buttonRow}>
            <Pressable style={[styles.button, styles.skipButton]} onPress={onSkip}>
              <Text style={[styles.buttonLabel, styles.skipLabel]}>Skip</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
              <Text style={[styles.buttonLabel, styles.confirmLabel]}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  tagRow: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipLabel: {
    ...typography.body,
    fontWeight: "600",
  },
  customChip: {
    borderColor: colors.textSecondary,
  },
  customChipLabel: {
    color: colors.textSecondary,
  },
  customChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  customChipActiveLabel: {
    color: colors.surface,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipLabel: {
    color: colors.textPrimary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  buttonLabel: {
    ...typography.body,
    fontWeight: "700",
  },
  confirmLabel: {
    color: colors.surface,
  },
});
