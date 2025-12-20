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
  gradient: string;
  accentColor: string;
  iconBg: string;
  progressColor: string;
}

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  residency: {
    icon: Stethoscope,
    gradient: "from-rose-500/20 to-pink-500/10",
    accentColor: "text-rose-400",
    iconBg: "bg-rose-500/15 border-rose-500/30",
    progressColor: "from-rose-400 to-pink-500",
  },
  fitness: {
    icon: Dumbbell,
    gradient: "from-orange-500/20 to-amber-500/10",
    accentColor: "text-orange-400",
    iconBg: "bg-orange-500/15 border-orange-500/30",
    progressColor: "from-orange-400 to-amber-500",
  },
  climbing: {
    icon: Mountain,
    gradient: "from-sky-500/20 to-cyan-500/10",
    accentColor: "text-sky-400",
    iconBg: "bg-sky-500/15 border-sky-500/30",
    progressColor: "from-sky-400 to-cyan-500",
  },
  outdoor: {
    icon: TreePine,
    gradient: "from-emerald-500/20 to-green-500/10",
    accentColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15 border-emerald-500/30",
    progressColor: "from-emerald-400 to-green-500",
  },
  german: {
    icon: Languages,
    gradient: "from-yellow-500/20 to-amber-500/10",
    accentColor: "text-yellow-400",
    iconBg: "bg-yellow-500/15 border-yellow-500/30",
    progressColor: "from-yellow-400 to-amber-500",
  },
  books: {
    icon: BookOpen,
    gradient: "from-violet-500/20 to-purple-500/10",
    accentColor: "text-violet-400",
    iconBg: "bg-violet-500/15 border-violet-500/30",
    progressColor: "from-violet-400 to-purple-500",
  },
  piano: {
    icon: Music,
    gradient: "from-fuchsia-500/20 to-pink-500/10",
    accentColor: "text-fuchsia-400",
    iconBg: "bg-fuchsia-500/15 border-fuchsia-500/30",
    progressColor: "from-fuchsia-400 to-pink-500",
  },
  travel: {
    icon: Plane,
    gradient: "from-blue-500/20 to-indigo-500/10",
    accentColor: "text-blue-400",
    iconBg: "bg-blue-500/15 border-blue-500/30",
    progressColor: "from-blue-400 to-indigo-500",
  },
  relationship: {
    icon: Heart,
    gradient: "from-red-500/20 to-rose-500/10",
    accentColor: "text-red-400",
    iconBg: "bg-red-500/15 border-red-500/30",
    progressColor: "from-red-400 to-rose-500",
  },
  social: {
    icon: Users,
    gradient: "from-teal-500/20 to-cyan-500/10",
    accentColor: "text-teal-400",
    iconBg: "bg-teal-500/15 border-teal-500/30",
    progressColor: "from-teal-400 to-cyan-500",
  },
  finance: {
    icon: Wallet,
    gradient: "from-lime-500/20 to-green-500/10",
    accentColor: "text-lime-400",
    iconBg: "bg-lime-500/15 border-lime-500/30",
    progressColor: "from-lime-400 to-green-500",
  },
  personal: {
    icon: Sparkles,
    gradient: "from-peach-400/20 to-peach-500/10",
    accentColor: "text-peach-400",
    iconBg: "bg-peach-400/15 border-peach-400/30",
    progressColor: "from-peach-300 to-peach-500",
  },
};

// Default style for unknown categories
export const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  icon: Sparkles,
  gradient: "from-stone-500/20 to-stone-600/10",
  accentColor: "text-stone-400",
  iconBg: "bg-stone-500/15 border-stone-500/30",
  progressColor: "from-stone-400 to-stone-500",
};

export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] || DEFAULT_CATEGORY_STYLE;
}
