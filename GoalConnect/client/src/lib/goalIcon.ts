const ICONS: Record<string, string> = {
  residency: "🎓",
  neuro: "🧠",
  neurology: "🧠",
  surgery: "🔬",
  fitness: "🏋️",
  lifting: "🏋️",
  cycling: "🚴",
  running: "🏃",
  cardio: "🏃",
  climbing: "🧗",
  outdoor: "🌿",
  nature: "🌿",
  books: "📚",
  reading: "📚",
  learning: "📖",
  study: "📖",
  german: "🇩🇪",
  language: "🇩🇪",
  piano: "🎹",
  music: "🎹",
  travel: "✈️",
  social: "💬",
  financial: "💰",
  money: "💰",
  health: "❤️",
  sleep: "😴",
  meditation: "🧘",
  mindfulness: "🧘",
};

export function goalIcon(category: string | null | undefined): string {
  if (!category) return "🎯";
  const key = category.toLowerCase().trim();
  if (ICONS[key]) return ICONS[key];
  for (const k of Object.keys(ICONS)) {
    if (key.includes(k)) return ICONS[k];
  }
  return "🎯";
}
