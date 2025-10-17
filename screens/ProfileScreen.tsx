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
import ConnectionTest from "../components/ConnectionTest";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";

export const ProfileScreen: FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigation = useNavigation<any>();
  const [showConnectionTest, setShowConnectionTest] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const rawName = user?.name ?? "";
  const displayName = rawName.trim() ? rawName : "Guest";
  const displayEmail = user?.email ?? "";
  const [formName, setFormName] = React.useState(rawName);
  const [formEmail, setFormEmail] = React.useState(displayEmail);

  const joinedLabel = useMemo(() => {
    if (!user?.createdAt) {
      return "Member";
    }
    try {
      return new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "Member";
    }
  }, [user?.createdAt]);

  React.useEffect(() => {
    if (!isEditing) {
      setFormName(rawName);
      setFormEmail(displayEmail);
    }
  }, [rawName, displayEmail, isEditing]);

  const isDirty = formName.trim() !== rawName.trim() || formEmail.trim() !== displayEmail.trim();
  const canSave = isDirty && !isSaving;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      Alert.alert("Logout Failed", error?.message ?? "Please try again.");
    }
  };

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
      await updateProfile({ name: nextName, email: nextEmail });
      Alert.alert("Profile Updated", "Your profile details have been saved.");
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert("Update Failed", error?.message ?? "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    navigation.navigate("ProfileChangePassword");
  };

  const handleOpenNotifications = () => {
    navigation.navigate("ProfileNotifications");
  };

  const goToIncomeExpenseHistory = () => {
    navigation.navigate("ProfileSpendingHistory");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
      <View style={styles.headerCard}>
        <View style={styles.avatarWrapper}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
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
        <TouchableOpacity style={styles.menuItem} onPress={handleOpenNotifications}>
          <Text style={styles.menuText}>Notifications</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowConnectionTest(true)}
        >
          <Text style={styles.menuText}>Test Connection</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={goToIncomeExpenseHistory}>
          <Text style={styles.menuText}>Income & Expense History</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
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

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* Connection Test Modal */}
      {showConnectionTest && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connection Test</Text>
              <TouchableOpacity onPress={() => setShowConnectionTest(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ConnectionTest />
          </View>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '600',
  },
  menuArrow: {
    ...typography.body,
    color: colors.textSecondary,
  },
  menuValue: {
    ...typography.body,
    color: colors.textSecondary,
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
  logoutButton: {
    backgroundColor: '#34D399',
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutText: {
    ...typography.heading,
    color: colors.surface,
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textSecondary,
  },
});
