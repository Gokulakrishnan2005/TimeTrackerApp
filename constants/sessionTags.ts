export interface SessionTagDefinition {
  id: string;
  label: string;
  color: string;
}

export const SESSION_TAGS: SessionTagDefinition[] = [
  { id: "work", label: "Work", color: "#0284C7" }, // Sky-600 - professional blue
  { id: "study", label: "Study", color: "#059669" }, // Emerald-600 - focused green
  { id: "review", label: "Review", color: "#7C3AED" }, // Violet-600 - analytical purple
  { id: "exercise", label: "Exercise", color: "#DC2626" }, // Red-600 - energetic red
  { id: "personal", label: "Personal", color: "#DB2777" }, // Pink-600 - warm pink
  { id: "project", label: "Project", color: "#2563EB" }, // Blue-600 - creative blue
  { id: "meeting", label: "Meeting", color: "#0891B2" }, // Cyan-600 - communicative teal
  { id: "break", label: "Break", color: "#64748B" }, // Slate-500 - neutral gray
];

export const FALLBACK_TAG_COLOR = "#9CA3AF";

export const findTagDefinition = (tag?: string | null): SessionTagDefinition | null => {
  if (!tag) {
    return null;
  }
  const normalized = tag.trim().toLowerCase();
  return SESSION_TAGS.find((item) => item.id === normalized) ?? null;
};

export const resolveTagColor = (tag?: string | null): string => {
  const match = findTagDefinition(tag);
  return match ? match.color : FALLBACK_TAG_COLOR;
};

export const resolveTagLabel = (tag?: string | null): string | null => {
  if (!tag) {
    return null;
  }
  const match = findTagDefinition(tag);
  if (match) {
    return match.label;
  }
  const trimmed = tag.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
};
