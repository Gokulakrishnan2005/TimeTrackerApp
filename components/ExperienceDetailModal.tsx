import { FC } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../constants/colors";
import { radii, spacing, typography } from "../constants/theme";

export interface ExperienceDetailModalProps {
  visible: boolean;
  title?: string;
  experience: string;
  onClose: () => void;
}

export const ExperienceDetailModal: FC<ExperienceDetailModalProps> = ({
  visible,
  title = "Session Reflection",
  experience,
  onClose,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.body}>{experience || "No reflection recorded."}</Text>
          </ScrollView>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: "80%",
  },
  title: {
    ...typography.heading,
    textAlign: "center",
  },
  scrollContent: {
    paddingVertical: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textPrimary,
  },
  closeButton: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  closeText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: "600",
  },
});
