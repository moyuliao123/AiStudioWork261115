export interface UnlockToken {
  label: string;
  requiredMinutes: number;
  level: number;
  categoryKind?: '飲品' | '甜點';
}

export const LEVEL_THRESHOLDS = [
  { level: 1, minMinutes: 0, rankTitle: '初訪咖啡客' },
  { level: 2, minMinutes: 25, rankTitle: '手沖練習生' },
  { level: 3, minMinutes: 60, rankTitle: '吧檯常客' },
  { level: 4, minMinutes: 120, rankTitle: '烘焙鑑賞家' },
  { level: 5, minMinutes: 240, rankTitle: '午夜咖啡師' },
  { level: 6, minMinutes: 400, rankTitle: '首席特調大師' },
];

export const PORTION_UNLOCKS: UnlockToken[] = [
  { label: '一杯', requiredMinutes: 0, level: 1 },
  { label: '一盤', requiredMinutes: 0, level: 1 },
  { label: '一口', requiredMinutes: 0, level: 1 },
  { label: '雙份', requiredMinutes: 25, level: 2 },
  { label: '手沖', requiredMinutes: 25, level: 2 },
  { label: '特大杯', requiredMinutes: 60, level: 3 },
  { label: '精緻', requiredMinutes: 60, level: 3 },
  { label: '限量', requiredMinutes: 120, level: 4 },
  { label: '金杯', requiredMinutes: 120, level: 4 },
  { label: '主廚特製', requiredMinutes: 240, level: 5 },
  { label: '午夜限定', requiredMinutes: 240, level: 5 },
  { label: '傳說中的', requiredMinutes: 400, level: 6 },
];

export const FLAVOR_UNLOCKS: UnlockToken[] = [
  { label: '微苦', requiredMinutes: 0, level: 1 },
  { label: '熱騰騰', requiredMinutes: 0, level: 1 },
  { label: '微甜', requiredMinutes: 0, level: 1 },
  { label: '香醇', requiredMinutes: 25, level: 2 },
  { label: '冰涼', requiredMinutes: 25, level: 2 },
  { label: '焦糖香氣', requiredMinutes: 60, level: 3 },
  { label: '滑順', requiredMinutes: 60, level: 3 },
  { label: '煙燻焙香', requiredMinutes: 120, level: 4 },
  { label: '花果香', requiredMinutes: 120, level: 4 },
  { label: '雲朵奶蓋', requiredMinutes: 240, level: 5 },
  { label: '黃金比例', requiredMinutes: 240, level: 5 },
  { label: '星空微光', requiredMinutes: 400, level: 6 },
];

export const ITEM_UNLOCKS: UnlockToken[] = [
  { label: '卡布奇諾', requiredMinutes: 0, level: 1, categoryKind: '飲品' },
  { label: '美式黑咖啡', requiredMinutes: 0, level: 1, categoryKind: '飲品' },
  { label: '原味司康', requiredMinutes: 0, level: 1, categoryKind: '甜點' },
  { label: '海鹽焦糖拿鐵', requiredMinutes: 25, level: 2, categoryKind: '飲品' },
  { label: '肉桂捲', requiredMinutes: 25, level: 2, categoryKind: '甜點' },
  { label: '西西里檸檬氣泡咖啡', requiredMinutes: 60, level: 3, categoryKind: '飲品' },
  { label: '抹茶巴斯克', requiredMinutes: 60, level: 3, categoryKind: '甜點' },
  { label: '耶加雪菲手沖', requiredMinutes: 120, level: 4, categoryKind: '飲品' },
  { label: '法式千層派', requiredMinutes: 120, level: 4, categoryKind: '甜點' },
  { label: '威士忌酒桶冷萃', requiredMinutes: 240, level: 5, categoryKind: '飲品' },
  { label: '松露可頌', requiredMinutes: 240, level: 5, categoryKind: '甜點' },
  { label: '晨光隱藏版特調', requiredMinutes: 400, level: 6, categoryKind: '飲品' },
  { label: '皇室提拉米蘇', requiredMinutes: 400, level: 6, categoryKind: '甜點' },
];

export function getLevelInfo(totalMinutes: number) {
  let current = LEVEL_THRESHOLDS[0];
  let next: (typeof LEVEL_THRESHOLDS)[number] | null = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalMinutes >= LEVEL_THRESHOLDS[i].minMinutes) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] ?? null;
    }
  }

  const progressPercent = next
    ? Math.min(
        100,
        Math.round(
          ((totalMinutes - current.minMinutes) / (next.minMinutes - current.minMinutes)) * 100
        )
      )
    : 100;

  return {
    level: current.level,
    rankTitle: current.rankTitle,
    nextLevelMinutes: next ? next.minMinutes : null,
    remainingToNext: next ? Math.max(0, next.minMinutes - totalMinutes) : 0,
    progressPercent,
  };
}

export function formatRecipeTitle(portion: string, flavor: string, item: string): string {
  return `[${portion}][${flavor}]的[${item}]`;
}

export function formatFullUserTitle(
  nickname: string,
  portion: string,
  flavor: string,
  item: string
): string {
  return `${nickname}/${formatRecipeTitle(portion, flavor, item)}`;
}

export function getNewlyUnlockedLabels(prevMinutes: number, nextMinutes: number): string[] {
  const allTokens = [...PORTION_UNLOCKS, ...FLAVOR_UNLOCKS, ...ITEM_UNLOCKS];
  return allTokens
    .filter((t) => t.requiredMinutes > prevMinutes && t.requiredMinutes <= nextMinutes)
    .map((t) => `[${t.label}]`);
}
