export type AmbienceId = 'rain' | 'espresso' | 'fireplace' | 'jazz' | 'silent';

export interface AmbienceOption {
  id: AmbienceId;
  label: string;
  description: string;
}

export type NoteColorId = 'butter' | 'apricot' | 'matcha' | 'sky' | 'rose';

export interface NoteColorTheme {
  id: NoteColorId;
  label: string;
  cardBg: string;
  cardBorder: string;
  swatchBg: string;
  tapeBg: string;
}

export type MoodTag = '平靜' | '充實' | '靈感' | '微累' | '咖啡續命中';

export interface MoodNote {
  id: string;
  content: string;
  mood: MoodTag;
  color: NoteColorId;
  focusMinutes: number;
  ambienceLabel: string;
  createdAt: string;
}

export const AMBIENCE_OPTIONS: AmbienceOption[] = [
  {
    id: 'rain',
    label: '雨天窗畔',
    description: '細雨輕敲木窗與咖啡館暖流',
  },
  {
    id: 'espresso',
    label: '義式吧檯',
    description: '柔和交談聲與遠處咖啡機蒸氣',
  },
  {
    id: 'fireplace',
    label: '壁爐翻書',
    description: '溫暖炭火微響與安靜紙頁氛圍',
  },
  {
    id: 'jazz',
    label: '晨間琴聲',
    description: '柔和溫暖的 Lo-Fi 電鋼琴和弦',
  },
  {
    id: 'silent',
    label: '靜音專注',
    description: '純粹安靜的倒數時光，僅保留結束提示音',
  },
];

export const NOTE_COLOR_THEMES: NoteColorTheme[] = [
  {
    id: 'butter',
    label: '奶油黃',
    cardBg: 'bg-[#FEF9C3]',
    cardBorder: 'border-[#FDE047]/70',
    swatchBg: 'bg-[#FDE047]',
    tapeBg: 'bg-[#F59E0B]/25',
  },
  {
    id: 'apricot',
    label: '蜜桃橘',
    cardBg: 'bg-[#FFEDD5]',
    cardBorder: 'border-[#FDBA74]/70',
    swatchBg: 'bg-[#FB923C]',
    tapeBg: 'bg-[#EA580C]/20',
  },
  {
    id: 'matcha',
    label: '抹茶綠',
    cardBg: 'bg-[#DCFCE7]',
    cardBorder: 'border-[#86EFAC]/70',
    swatchBg: 'bg-[#4ADE80]',
    tapeBg: 'bg-[#16A34A]/20',
  },
  {
    id: 'sky',
    label: '晴空藍',
    cardBg: 'bg-[#E0F2FE]',
    cardBorder: 'border-[#7DD3FC]/70',
    swatchBg: 'bg-[#38BDF8]',
    tapeBg: 'bg-[#0284C7]/20',
  },
  {
    id: 'rose',
    label: '玫瑰茶',
    cardBg: 'bg-[#FCE7F3]',
    cardBorder: 'border-[#F9A8D4]/70',
    swatchBg: 'bg-[#F472B6]',
    tapeBg: 'bg-[#DB2777]/20',
  },
];

export const MOOD_TAGS: MoodTag[] = ['平靜', '充實', '靈感', '微累', '咖啡續命中'];

export const PRESET_MINUTES = [15, 25, 45, 60];

export const STARTER_NOTES: MoodNote[] = [
  {
    id: 'starter-1',
    content: '窗外下著細雨，剛讀完第三章筆記，熱拿鐵的溫度剛剛好。',
    mood: '平靜',
    color: 'butter',
    focusMinutes: 25,
    ambienceLabel: '雨天窗畔',
    createdAt: '今天 09:45',
  },
  {
    id: 'starter-2',
    content: '把最難的那份架構圖拆解完畢，心裡踏實了許多，繼續下一輪！',
    mood: '充實',
    color: 'matcha',
    focusMinutes: 45,
    ambienceLabel: '晨間琴聲',
    createdAt: '今天 11:20',
  },
  {
    id: 'starter-3',
    content: '突然想到一個超棒的解法，趕緊記下來，先去續杯冰美式。',
    mood: '靈感',
    color: 'apricot',
    focusMinutes: 25,
    ambienceLabel: '義式吧檯',
    createdAt: '今天 14:10',
  },
];
