import { StyleSheet } from "react-native";
import { colors } from "./colors";

export const typography = {
  // Giant display text for timers and big numbers
  hero: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: "900" as const,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  // Large display headings
  display: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "800" as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  // Section headings
  heading: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
    color: colors.textPrimary,
  },
  // Subsection headings
  subheading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
  // Body text
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    color: colors.textPrimary,
  },
  // Smaller body text
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    color: colors.textSecondary,
  },
  // Labels and captions
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radii = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const shadows = {
  card: {
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  cardHover: {
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
    elevation: 6,
  },
  button: {
    boxShadow: `0px 4px 12px ${colors.primary}4D`,
    elevation: 5,
  },
  floating: {
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
    elevation: 10,
  },
};

export const layout = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: "600" as const,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center" as const,
  },
});

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  layout,
};
