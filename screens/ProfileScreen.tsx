import React, { FC, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { colors } from "../constants/colors";
import { spacing, typography, radii } from "../constants/theme";
import { storeData, getData } from "../services/LocalStorage";
import { exportAppData, importAppData } from "../services/dataTransferService";
import taskService from "../services/taskService";

interface LocalProfile {
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

const PROFILE_STORAGE_KEY = "profile_data";

import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../navigation/AppNavigator';

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

type Props = {
  navigation: ProfileScreenNavigationProp;
};

export const ProfileScreen: FC<Props> = ({ navigation }) => {
  const welcomeMessage = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! ☀️";
    if (hour < 18) return "Good afternoon! 🌤️";
    return "Good evening! 🌙";
  }, []);

  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [profile, setProfile] = React.useState<LocalProfile>({
    name: "Guest",
    email: "",
    createdAt: new Date().toISOString(),
  });
  const [formName, setFormName] = React.useState("Guest");
  const [formEmail, setFormEmail] = React.useState("");

  React.useEffect(() => {
    const loadProfile = async () => {
      const saved = await getData(PROFILE_STORAGE_KEY);
      if (saved) {
        setProfile({
          name: saved.name ?? "Guest",
          email: saved.email ?? "",
          avatar: saved.avatar,
          createdAt: saved.createdAt ?? new Date().toISOString(),
        });
      } else {
        const initialProfile: LocalProfile = {
          name: "Guest",
          email: "",
          createdAt: new Date().toISOString(),
        };
        await storeData(PROFILE_STORAGE_KEY, initialProfile);
        setProfile(initialProfile);
      }
    };
    loadProfile();
  }, []);

  const [unfinishedCount, setUnfinishedCount] = React.useState(0);
  const [unfinishedGoalsCount, setUnfinishedGoalsCount] = React.useState(0);

  React.useEffect(() => {
    const loadUnfinished = async () => {
      try {
        const tasks = await taskService.getUnfinishedTasks();
        const goals = await taskService.getUnfinishedGoals();
        setUnfinishedCount(tasks.length);
        setUnfinishedGoalsCount(goals.length);
      } catch (error) {
        setUnfinishedCount(0);
        setUnfinishedGoalsCount(0);
      }
    };

    const unsubscribe = navigation.addListener('focus', loadUnfinished);
    loadUnfinished();
    return unsubscribe;
  }, [navigation]);

  React.useEffect(() => {
    if (!isEditing) {
      setFormName(profile.name ?? "");
      setFormEmail(profile.email ?? "");
    }
  }, [profile, isEditing]);

  const rawName = profile.name ?? "";
  const displayName = rawName.trim() ? rawName : "Guest";
  const displayEmail = profile.email ?? "";

  const joinedLabel = useMemo(() => {
    if (!profile.createdAt) {
      return "Member";
    }
    try {
      return new Date(profile.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "Member";
    }
  }, [profile.createdAt]);

  React.useEffect(() => {
    if (!isEditing) {
      setFormName(rawName);
      setFormEmail(displayEmail);
    }
  }, [rawName, displayEmail, isEditing]);

  const isDirty = formName.trim() !== rawName.trim() || formEmail.trim() !== displayEmail.trim();
  const canSave = isDirty && !isSaving;

  const handleEditProfile = () => {
    setIsEditing(true);
    setFormName(rawName);
    setFormEmail(displayEmail);
  };

  const handleCancelEdit = () => {
    setFormName(rawName);
    setFormEmail(displayEmail);
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    const nextName = formName.trim();
    const nextEmail = formEmail.trim();

    if (!nextName.length) {
      Alert.alert("Invalid Name", "Please enter your name.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(nextEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      setIsSaving(true);
      const nextProfile: LocalProfile = {
        ...profile,
        name: nextName,
        email: nextEmail,
      };
      setProfile(nextProfile);
      await storeData(PROFILE_STORAGE_KEY, nextProfile);
      Alert.alert("Profile Updated", "Your profile details have been saved.");
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert("Update Failed", error?.message ?? "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      "Coming Soon",
      "Password changes will be available in a future update."
    );
  };

  const handleOpenNotifications = () => {
    Alert.alert(
      "Coming Soon",
      "Notification settings will be available in a future update."
    );
  };

  const goToIncomeExpenseHistory = () => {
    Alert.alert(
      "Coming Soon",
      "Income & expense history will be available in a future update."
    );
  };

  const goToUnfinishedTasks = () => {
    Alert.alert(
      "Coming Soon",
      "Unfinished tasks screen will be available in a future update."
    );
  };

  const goToUnfinishedGoals = () => {
    Alert.alert(
      "Coming Soon",
      "Unfinished goals screen will be available in a future update."
    );
  };

  const handleExportData = async () => {
    try {
      const result = await exportAppData();
      if (result.savedLocally) {
        Alert.alert(
          "Export Complete",
          `Backup saved to local app storage as ${result.fileName}. Use Import Data to restore.`
        );
      } else {
        Alert.alert(
          "Export Complete",
          "Backup saved to your selected folder. Keep it safe for future imports."
        );
      }
    } catch (error: any) {
      Alert.alert("Export Failed", error?.message ?? "Please try again.");
    }
  };

  const handleCreateSampleData = async () => {
    try {
      await taskService.createSampleUnfinishedData();
      Alert.alert('Success', 'Sample unfinished data created! Check the Unfinished Tasks/Goals screens.');
    } catch (error) {
      Alert.alert('Error', 'Failed to create sample data');
    }
  };

  const handleImportData = async () => {
    try {
      const imported = await importAppData();
      if (imported.profile) {
        setProfile(imported.profile);
      }
      Alert.alert(
        "Import Complete",
        `Restored ${imported.sessionsImported} tasks and goals.`
      );
    } catch (error: any) {
      Alert.alert("Import Failed", error?.message ?? "Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
      <Text style={styles.title}>{welcomeMessage}</Text>
      <View style={styles.headerCard}>
        <View style={styles.avatarWrapper}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerName}>{displayName}</Text>
        <Text style={styles.headerEmail}>{displayEmail || "Add your email"}</Text>
        <View style={styles.headerRow}>
          <View style={styles.headerChip}>
            <Text style={styles.headerChipLabel}>Member since</Text>
            <Text style={styles.headerChipValue}>{joinedLabel}</Text>
          </View>
          <View style={styles.headerChip}>
            <Text style={styles.headerChipLabel}>Status</Text>
            <Text style={styles.headerChipValue}>Active</Text>
          </View>
          <View style={styles.headerChip}>
            <Text style={styles.headerChipLabel}>Unfinished tasks</Text>
            <Text style={[styles.headerChipValue, unfinishedCount > 0 && styles.warningText]}>{unfinishedCount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.fieldInput}
            value={formName}
            editable={isEditing && !isSaving}
            placeholder="Your name"
            placeholderTextColor={colors.textSecondary}
            onChangeText={setFormName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.fieldInput}
            value={formEmail}
            editable={isEditing && !isSaving}
            placeholder="Your email"
            placeholderTextColor={colors.textSecondary}
            onChangeText={setFormEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
        </View>
        <View style={styles.actionRow}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, !canSave && styles.primaryButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={!canSave}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCancelEdit}
                disabled={isSaving}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleEditProfile}>
                <Text style={styles.primaryButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleChangePassword}>
                <Text style={styles.secondaryButtonText}>Change Password</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Wishlist')}>
          <Text style={styles.menuText}>Future Purchases & Wishlist</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleOpenNotifications}>
          <Text style={styles.menuText}>Notifications</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleExportData}>
          <Text style={styles.menuText}>Export Data (JSON)</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleImportData}>
          <Text style={styles.menuText}>Import Data (JSON)</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={goToIncomeExpenseHistory}>
          <Text style={styles.menuText}>Income & Expense History</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={goToUnfinishedTasks}>
          <View style={styles.menuLabelRow}>
            <Text style={styles.menuText}>Unfinished Tasks</Text>
            {unfinishedCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{unfinishedCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileAccomplishedTasks')}>
          <Text style={styles.menuText}>Accomplished Tasks</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={goToUnfinishedGoals}>
          <View style={styles.menuLabelRow}>
            <Text style={styles.menuText}>Unfinished Goals</Text>
            {unfinishedGoalsCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{unfinishedGoalsCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        {__DEV__ && (
          <TouchableOpacity style={styles.menuItem} onPress={handleCreateSampleData}>
            <Text style={styles.menuText}>Create Sample Data (Dev)</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>Vision</Text>
          <Text style={styles.aboutCopy}>
            Track your finances and goals easily. Stay focused on progress with clean visuals and intuitive insights.
          </Text>
        </View>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>App Version</Text>
          <Text style={styles.menuValue}>0.1.2(alpha)</Text>
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
  containerContent: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  avatarInitial: {
    ...typography.display,
    color: colors.primary,
    fontWeight: "700",
  },
  headerName: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  headerEmail: {
    ...typography.body,
    color: colors.textSecondary,
  },
  headerRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  headerChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  headerChipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  headerChipValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  warningText: {
    color: "#DC2626",
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    ...typography.body,
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  menuArrow: {
    ...typography.heading,
    color: colors.textSecondary,
  },
  menuValue: {
    ...typography.body,
    color: colors.textSecondary,
  },
  menuLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  countBadgeText: {
    ...typography.caption,
    color: "#DC2626",
    fontWeight: "600",
  },
  aboutCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  aboutTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  aboutCopy: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
