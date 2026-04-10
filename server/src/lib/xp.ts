const XP_PER_LEVEL = 500;

export function computeLevel(totalXp: number) {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXp % XP_PER_LEVEL;
  const xpProgress = (xpInLevel / XP_PER_LEVEL) * 100;
  return { level, xpInLevel, xpToNext: XP_PER_LEVEL, xpProgress };
}
