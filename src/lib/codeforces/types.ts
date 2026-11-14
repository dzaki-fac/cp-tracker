/**
 * Types mirroring the official Codeforces REST API responses.
 * @see https://codeforces.com/apiHelp
 */

export interface CodeforcesProblem {
  contestId?: number | null;
  problemsetName?: string | null;
  index?: string | null;
  name: string;
  type?: string | null;
  rating?: number | null;
  tags?: string[] | null;
  points?: number | null;
}

export interface CodeforcesMember {
  handle: string;
}

export interface CodeforcesAuthor {
  contestId?: number | null;
  members?: CodeforcesMember[] | null;
  participantType?: string | null;
  ghost?: boolean | null;
  startTimeSeconds?: number | null;
}

export interface CodeforcesSubmission {
  id: number;
  contestId?: number | null;
  creationTimeSeconds: number;
  relativeTimeSeconds?: number | null;
  problem: CodeforcesProblem;
  author?: CodeforcesAuthor | null;
  programmingLanguage?: string | null;
  verdict?: string | null;
  testset?: string | null;
  passedTestCount?: number | null;
  timeConsumedMillis?: number | null;
  memoryConsumedBytes?: number | null;
}

export interface CodeforcesUserInfo {
  handle: string;
  email?: string | null;
  vkId?: string | null;
  openId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  city?: string | null;
  organization?: string | null;
  contribution?: number | null;
  rank?: string | null;
  rating?: number | null;
  maxRank?: string | null;
  maxRating?: number | null;
  lastOnlineTimeSeconds?: number | null;
  registrationTimeSeconds?: number | null;
  friendOfCount?: number | null;
  avatar?: string | null;
  titlePhoto?: string | null;
}

export interface CodeforcesRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

/** Standard Codeforces envelope: { status: "OK" | "FAILED", result: T }. */
export interface CodeforcesEnvelope<T> {
  status: "OK" | "FAILED";
  result?: T;
  comment?: string;
}
