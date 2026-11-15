/**
 * Codeforces rank colors — shared between charts, badges and tables.
 * Values follow the well-known Codeforces rank palette on light surfaces.
 */

export const CF_RANK_COLORS = {
  newbie: "#808080",
  pupil: "#00a900",
  specialist: "#03a89e",
  expert: "#0000ff",
  "candidate master": "#aa00aa",
  master: "#ff8c00",
  "international master": "#ff8c00",
  grandmaster: "#ff0000",
  "international grandmaster": "#ff0000",
  "legendary grandmaster": "#ff0000",
} as const satisfies Record<string, string>;

export type CodeforcesRank = keyof typeof CF_RANK_COLORS;

/** Color for a numeric difficulty rating (100-point Codeforces bands). */
export function getRankColor(rating: number): string {
  if (rating < 1200) return CF_RANK_COLORS.newbie;
  if (rating < 1400) return CF_RANK_COLORS.pupil;
  if (rating < 1600) return CF_RANK_COLORS.specialist;
  if (rating < 1900) return CF_RANK_COLORS.expert;
  if (rating < 2100) return CF_RANK_COLORS["candidate master"];
  if (rating < 2400) return CF_RANK_COLORS.master;
  return CF_RANK_COLORS.grandmaster;
}

/** Color for a rank name (case-insensitive); undefined when unknown. */
export function getRankColorByName(
  rank: string | null | undefined,
): string | undefined {
  if (!rank) return undefined;
  const key = rank.toLowerCase();
  return key in CF_RANK_COLORS ? CF_RANK_COLORS[key as CodeforcesRank] : undefined;
}
