import { FC } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors } from "../constants/colors";
import { spacing, typography } from "../constants/theme";

export const ProfileScreen: FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile & Settings</Text>
        <Text style={styles.subtitle}>
          Manage your account and app preferences
        </Text>
        
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>👤</Text>
          <Text style={styles.placeholderTitle}>Coming Soon</Text>
          <Text style={styles.placeholderDescription}>
            Profile management and settings will be available here
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  placeholder: {
    marginTop: spacing.xxxl,
    alignItems: "center",
    gap: spacing.lg,
  },
  placeholderText: {
    fontSize: 64,
  },
  placeholderTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  placeholderDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
});
