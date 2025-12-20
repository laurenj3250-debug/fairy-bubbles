import {
  Stethoscope,
  Dumbbell,
  Mountain,
  TreePine,
  Languages,
  BookOpen,
  Music,
  Plane,
  Heart,
  Users,
  Wallet,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface CategoryStyle {
  icon: LucideIcon;
  accentColor: string;
  iconBg: string;
  progressColor: string;
}

// Consistent peach theming - matching the app's design system
const PEACH_STYLE = {
  accentColor: "text-peach-400",
  iconBg: "bg-peach-400/10 border-peach-400/20",
  progressColor: "from-peach-300 to-peach-500",
};

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  residency: {
    icon: Stethoscope,
    ...PEACH_STYLE,
  },
  fitness: {
    icon: Dumbbell,
    ...PEACH_STYLE,
  },
  climbing: {
    icon: Mountain,
    ...PEACH_STYLE,
  },
  outdoor: {
    icon: TreePine,
    ...PEACH_STYLE,
  },
  german: {
    icon: Languages,
    ...PEACH_STYLE,
  },
  books: {
    icon: BookOpen,
    ...PEACH_STYLE,
  },
  piano: {
    icon: Music,
    ...PEACH_STYLE,
  },
  travel: {
    icon: Plane,
    ...PEACH_STYLE,
  },
  relationship: {
    icon: Heart,
    ...PEACH_STYLE,
  },
  social: {
    icon: Users,
    ...PEACH_STYLE,
  },
  finance: {
    icon: Wallet,
    ...PEACH_STYLE,
  },
  personal: {
    icon: Sparkles,
    ...PEACH_STYLE,
  },
};

// Default style for unknown categories
export const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  icon: Sparkles,
  ...PEACH_STYLE,
};

export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] || DEFAULT_CATEGORY_STYLE;
}
