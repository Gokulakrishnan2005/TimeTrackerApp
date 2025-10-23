import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  AppStateStatus,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ViewStyle } from "react-native";
import { colors } from "../constants/colors";
import { layout, radii, spacing, typography } from "../constants/theme";
import { getCurrentStreakTime } from "../utils/time";
import { Session } from "../services/session";
import {
  deleteSession,
  getActiveSession,
  getAllSessions,
  startNewSession,
  stopSession,
  updateSessionExperience,
} from "../services/sessionStorage";
import { ExperienceModal } from "../components/ExperienceModal";
import { SessionsTable } from "../components/SessionsTable";
import { ExperienceDetailModal } from "../components/ExperienceDetailModal";
import { DurationTrendChart } from "../components/DurationTrendChart";

const INITIAL_TIMER = "0 MINUTES";
const AnimatedView = Animated.createAnimatedComponent(View);
type RefreshOptions = {
  silent?: boolean;
  isPullRefresh?: boolean;
};
const MS_IN_MINUTE = 60 * 1000;
const MS_IN_HOUR = 60 * MS_IN_MINUTE;
const HOURS_IN_DAY = 24;
type ModalMode = "capture" | "edit";

export const HomeScreen = () => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [timerLabel, setTimerLabel] = useState(INITIAL_TIMER);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isExperienceModalVisible, setExperienceModalVisible] = useState(false);
  const [experienceText, setExperienceText] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isSavingExperience, setIsSavingExperience] = useState(false);
  const [sessionBeingEdited, setSessionBeingEdited] = useState<Session | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("capture");
  const [selectedSessionForDetail, setSelectedSessionForDetail] = useState<Session | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const stateAnim = useRef(new Animated.Value(0)).current;

  const isActive = Boolean(activeSession);

  const handleError = useCallback((error: unknown, fallbackMessage: string) => {
    console.error(fallbackMessage, error);
    const baseMessage =
      error instanceof Error && error.message ? error.message : fallbackMessage;
    const friendlyMessage = `${baseMessage} If the issue continues, please check your connection or free up storage and try again.`;
    setErrorMessage(friendlyMessage);
  }, []);

  const refreshState = useCallback(
    async ({ silent, isPullRefresh }: RefreshOptions = {}) => {
      if (!silent) {
        setErrorMessage(null);
      }
      if (isPullRefresh) {
        setIsRefreshing(true);
      }
      try {
        const [session, storedSessions] = await Promise.all([
          getActiveSession(),
          getAllSessions(),
        ]);
        setActiveSession(session);
        setSessions(storedSessions);
      } catch (error) {
        handleError(error, "We couldn't refresh your sessions.");
      } finally {
        if (isPullRefresh) {
          setIsRefreshing(false);
        }
      }
    },
    [handleError]
  );

  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        await refreshState();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [refreshState]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        refreshState({ silent: true });
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [refreshState]);

  useEffect(() => {
    if (!activeSession) {
      setTimerLabel(INITIAL_TIMER);
      return;
    }

    const updateTimer = () => {
      setTimerLabel(getCurrentStreakTime(activeSession.startDateTime));
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [activeSession]);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.05 : 1,
      useNativeDriver: true,
      stiffness: 200,
      damping: 20,
    }).start();

    Animated.timing(stateAnim, {
      toValue: isActive ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isActive, scaleAnim, stateAnim]);

  const buttonLabel = useMemo(() => (isActive ? "Stop Session" : "Start Session"), [isActive]);
  const instruction = useMemo(
    () => (isActive ? "Tap to stop tracking" : "Tap to start tracking your progress"),
    [isActive]
  );

  const scaleStyle = useMemo<Animated.WithAnimatedObject<ViewStyle>>(
    () =>
      ({
        transform: [{ scale: scaleAnim }],
      }) as Animated.WithAnimatedObject<ViewStyle>,
    [scaleAnim]
  );

  const backgroundColorStyle = useMemo<Animated.WithAnimatedObject<ViewStyle>>(
    () =>
      ({
        backgroundColor: stateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [colors.primary, colors.danger],
        }),
      }) as Animated.WithAnimatedObject<ViewStyle>,
    [stateAnim]
  );

  const handleStart = useCallback(async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const session = await startNewSession();
      setActiveSession(session);
      await refreshState({ silent: true });
    } catch (error: unknown) {
      handleError(error, "Unable to start a new session.");
    } finally {
      setIsProcessing(false);
    }
  }, [handleError, refreshState]);

  const handleStop = useCallback(() => {
    if (!activeSession) {
      return;
    }

    setExperienceModalVisible(true);
  }, [activeSession]);

  const handlePress = useCallback(() => {
    if (isProcessing) {
      return;
    }

    if (isActive) {
      handleStop();
    } else {
      handleStart();
    }
  }, [handleStart, handleStop, isActive, isProcessing]);

  const handleRowPress = useCallback((session: Session) => {
    setSelectedSessionForDetail(session);
  }, []);

  const handleDetailClose = useCallback(() => {
    setSelectedSessionForDetail(null);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshState({ isPullRefresh: true });
  }, [refreshState]);

  const totalDurationSummary = useMemo(() => {
    const totalMs = sessions.reduce((acc, session) => acc + session.duration, 0);
    if (totalMs <= 0) {
      return "0 minutes";
    }

    const totalHours = Math.floor(totalMs / MS_IN_HOUR);
    if (totalHours >= HOURS_IN_DAY) {
      const days = Math.floor(totalHours / HOURS_IN_DAY);
      const hours = totalHours % HOURS_IN_DAY;
      const dayLabel = `${days} day${days === 1 ? "" : "s"}`;
      if (hours > 0) {
        const hourLabel = `${hours} hour${hours === 1 ? "" : "s"}`;
        return `${dayLabel}, ${hourLabel}`;
      }
      return dayLabel;
    }

    if (totalHours > 0) {
      const minutes = Math.floor((totalMs % MS_IN_HOUR) / MS_IN_MINUTE);
      if (minutes > 0) {
        return `${totalHours} hour${totalHours === 1 ? "" : "s"}, ${minutes} min`;
      }
      return `${totalHours} hour${totalHours === 1 ? "" : "s"}`;
    }

    const totalMinutes = Math.floor(totalMs / MS_IN_MINUTE);
    return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;
  }, [sessions]);

  const handleExperienceCancel = useCallback(() => {
    if (isSavingExperience) {
      return;
    }
    setExperienceModalVisible(false);
    setExperienceText("");
  }, [isSavingExperience]);

  const handleExperienceSave = useCallback(async () => {
    if (!activeSession || isSavingExperience) {
      return;
    }

    try {
      setIsSavingExperience(true);
      setErrorMessage(null);
      const trimmedExperience = experienceText.trim();
      await stopSession(activeSession.id, trimmedExperience);
      await refreshState({ silent: true });
      setExperienceModalVisible(false);
      setExperienceText("");
      setTimerLabel(INITIAL_TIMER);
    } catch (error: unknown) {
      handleError(error, "Unable to stop the current session.");
    } finally {
      setIsSavingExperience(false);
    }
  }, [
    activeSession,
    experienceText,
    isSavingExperience,
    handleError,
    refreshState,
  ]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.content}>
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorTitle}>We hit a snag</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <Pressable
              style={styles.errorDismissButton}
              onPress={() => setErrorMessage(null)}
            >
              <Text style={styles.errorDismissText}>Dismiss</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hi Dude! 👋</Text>
          <Text style={styles.subtitle}>Build your 1% better self</Text>
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.instruction}>{instruction}</Text>
          <Pressable
            style={[styles.pressableWrapper, isPressed && styles.actionButtonPressed]}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            onPress={handlePress}
            disabled={isProcessing}
          >
            <AnimatedView style={[styles.actionButton, backgroundColorStyle, isProcessing && styles.actionButtonDisabled]}>
              <AnimatedView style={[StyleSheet.absoluteFill, scaleStyle, styles.actionButtonInner]}>
                {isProcessing ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.actionButtonText}>{buttonLabel}</Text>
                )}
              </AnimatedView>
            </AnimatedView>
          </Pressable>

          <Text style={styles.timerLabel}>{timerLabel}</Text>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.bottomTitle}>History Overview</Text>
          <SessionsTable
            sessions={sessions}
            fallbackText="No sessions recorded yet. Start tracking to see your history here."
            onRowPress={handleRowPress}
          />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Time</Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{totalDurationSummary}</Text>
          </View>
          <View style={styles.chartIntro}>
            <Text style={styles.chartIntroTitle}>
              Your Progress Journey
            </Text>
            <Text style={styles.chartIntroCopy}>
              Every session builds momentum. Track your consistency and watch your dedication grow over time.
            </Text>
          </View>
          <DurationTrendChart sessions={sessions} />
        </View>

        <ExperienceModal
          visible={isExperienceModalVisible}
          value={experienceText}
          onChangeText={setExperienceText}
          onCancel={handleExperienceCancel}
          onSave={handleExperienceSave}
          isSaving={isSavingExperience}
        />

        <ExperienceDetailModal
          visible={Boolean(selectedSessionForDetail)}
          experience={selectedSessionForDetail?.experience ?? ""}
          title={`Session #${selectedSessionForDetail?.sessionNumber ?? ""}`}
          onClose={handleDetailClose}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    alignItems: "center",
    gap: spacing.xxxl,
  },
  content: {
    width: "100%",
    maxWidth: 960,
    gap: spacing.xxxl,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 0,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    alignSelf: "stretch",
  },
  errorTitle: {
    ...typography.subheading,
    color: "#BE123C",
    fontWeight: "600",
  },
  errorMessage: {
    ...typography.body,
    color: "#881337",
  },
  errorDismissButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: "#F43F5E",
  },
  errorDismissText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: "600",
  },
  header: {
    gap: spacing.xs,
    alignSelf: "stretch",
  },
  greeting: {
    ...typography.display,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 18,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xxxl,
    alignItems: "center",
    gap: spacing.xl,
    alignSelf: "stretch",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  instruction: {
    ...typography.body,
    textAlign: "center",
    color: colors.textSecondary,
  },
  pressableWrapper: {
    width: "100%",
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  timerLabel: {
    fontSize: 42,
    lineHeight: 52,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  bottomSection: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.xl,
    alignSelf: "stretch",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  bottomTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  chartIntro: {
    gap: spacing.xs,
  },
  chartIntroTitle: {
    ...typography.heading,
    fontSize: 20,
    letterSpacing: 0.5,
  },
  chartIntroCopy: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.surface,
    opacity: 0.9,
    flexShrink: 0,
  },
  summaryValue: {
    ...typography.heading,
    color: colors.surface,
    fontWeight: "800",
    flex: 1,
    textAlign: "right",
    flexShrink: 1,
    fontSize: 22,
  },
});
