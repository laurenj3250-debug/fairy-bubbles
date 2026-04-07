/**
 * Shared icon map for Sundown habit components.
 * SVG element data extracted from lucide-react v0.453.0.
 * Keys match the icon names stored in the habits DB table.
 */

type SvgElement =
  | { type: 'path'; d: string }
  | { type: 'circle'; cx: string; cy: string; r: string }
  | { type: 'rect'; x: string; y: string; width: string; height: string; rx: string };

export const ICON_MAP: Record<string, SvgElement[]> = {
  Languages: [
    { type: 'path', d: 'm5 8 6 6' },
    { type: 'path', d: 'm4 14 6-6 2-3' },
    { type: 'path', d: 'M2 5h12' },
    { type: 'path', d: 'M7 2h1' },
    { type: 'path', d: 'm22 22-5-10-5 10' },
    { type: 'path', d: 'M14 18h6' },
  ],
  GraduationCap: [
    { type: 'path', d: 'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z' },
    { type: 'path', d: 'M22 10v6' },
    { type: 'path', d: 'M6 12.5V16a6 3 0 0 0 12 0v-3.5' },
  ],
  Dumbbell: [
    { type: 'path', d: 'M14.4 14.4 9.6 9.6' },
    { type: 'path', d: 'M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z' },
    { type: 'path', d: 'm21.5 21.5-1.4-1.4' },
    { type: 'path', d: 'M3.9 3.9 2.5 2.5' },
    { type: 'path', d: 'M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z' },
  ],
  Music: [
    { type: 'path', d: 'M9 18V5l12-2v13' },
    { type: 'circle', cx: '6', cy: '18', r: '3' },
    { type: 'circle', cx: '18', cy: '16', r: '3' },
  ],
  Sun: [
    { type: 'circle', cx: '12', cy: '12', r: '4' },
    { type: 'path', d: 'M12 2v2' },
    { type: 'path', d: 'M12 20v2' },
    { type: 'path', d: 'm4.93 4.93 1.41 1.41' },
    { type: 'path', d: 'm17.66 17.66 1.41 1.41' },
    { type: 'path', d: 'M2 12h2' },
    { type: 'path', d: 'M20 12h2' },
    { type: 'path', d: 'm6.34 17.66-1.41 1.41' },
    { type: 'path', d: 'm19.07 4.93-1.41 1.41' },
  ],
  BookOpen: [
    { type: 'path', d: 'M12 7v14' },
    { type: 'path', d: 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z' },
  ],
  FileText: [
    { type: 'path', d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' },
    { type: 'path', d: 'M14 2v4a2 2 0 0 0 2 2h4' },
    { type: 'path', d: 'M10 9H8' },
    { type: 'path', d: 'M16 13H8' },
    { type: 'path', d: 'M16 17H8' },
  ],
  Video: [
    { type: 'path', d: 'm16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5' },
    { type: 'rect', x: '2', y: '6', width: '14', height: '12', rx: '2' },
  ],
  Mountain: [
    { type: 'path', d: 'm8 3 4 8 5-5 5 15H2L8 3z' },
  ],
  Activity: [
    { type: 'path', d: 'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2' },
  ],
  Droplet: [
    { type: 'path', d: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z' },
  ],
  Moon: [
    { type: 'path', d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' },
  ],
};

// Emoji aliases — existing habits store emoji strings, map them to Lucide equivalents
const EMOJI_ALIASES: Record<string, string> = {
  '\u{1F4DA}': 'BookOpen',    // 📚
  '\u{1F4D6}': 'BookOpen',    // 📖
  '\u{1F4D3}': 'BookOpen',    // 📓
  '\u{1F4CB}': 'FileText',    // 📋
  '\u{1F4C4}': 'FileText',    // 📄
  '\u{2B50}': 'Sun',          // ⭐
  '\u{1F31F}': 'Sun',         // 🌟
  '\u{1F319}': 'Moon',        // 🌙
  '\u{1F3CB}': 'Dumbbell',    // 🏋
  '\u{1F3CB}\uFE0F': 'Dumbbell', // 🏋️
  '\u{1F4A7}': 'Droplet',     // 💧
  '\u{1F3A7}': 'Music',       // 🎧
  '\u{1F1E9}\u{1F1EA}': 'Languages', // 🇩🇪
  '\u{26F0}': 'Mountain',     // ⛰
  '\u{1F3D4}\uFE0F': 'Mountain', // 🏔️
};

export function resolveIcon(icon?: string): SvgElement[] {
  if (!icon) return DEFAULT_ELEMENTS;
  // Direct Lucide name match
  if (ICON_MAP[icon]) return ICON_MAP[icon];
  // Emoji alias match
  const alias = EMOJI_ALIASES[icon];
  if (alias && ICON_MAP[alias]) return ICON_MAP[alias];
  return DEFAULT_ELEMENTS;
}

const DEFAULT_ELEMENTS: SvgElement[] = [
  { type: 'path', d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' },
  { type: 'path', d: 'M14 2v4a2 2 0 0 0 2 2h4' },
];

interface HabitIconProps {
  icon?: string;
  size?: number;
}

export function HabitIcon({ icon, size = 20 }: HabitIconProps) {
  const elements = resolveIcon(icon);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--sd-text-accent)"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, filter: 'drop-shadow(0 0 3px rgba(225,164,92,0.2))' }}
    >
      {elements.map((el, i) => {
        if (el.type === 'path') return <path key={i} d={el.d} />;
        if (el.type === 'circle') return <circle key={i} cx={el.cx} cy={el.cy} r={el.r} />;
        if (el.type === 'rect') return <rect key={i} x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx} />;
        return null;
      })}
    </svg>
  );
}
