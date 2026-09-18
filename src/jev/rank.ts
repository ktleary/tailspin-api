import {
  CHARACTER_INSTRUCTIONS,
  CHARACTER_LEVELS,
  ENDING_CRITERIA,
  ENDING_INSTRUCTIONS,
  FIT_INSTRUCTIONS,
  FIT_LEVELS,
  JEV_MODEL,
  SAMPLE_K,
  isCharacterField,
  isEndingField,
  type RankField,
} from "./questions";

export type { RankField };

export interface Character {
  givenName?: string;
  familyName?: string;
  age?: number;
  attributes?: string[];
  occupation?: string;
}

export interface PartialStory {
  theme?: string;
  characters?: Character[];
  location?: string;
  time?: string;
  plotPoint?: string;
  conflict?: string;
  ending?: string;
  tone?: string;
}

export type JevQuestion =
  | { type: "score"; instructions: string; criteria: readonly string[] }
  | {
      type: "noul";
      instructions: string;
      criteria?: { true: string; false: string };
    };

export interface JevRequest {
  state: string;
  model: string;
  questions: Record<string, JevQuestion>;
}

export interface RankedItem {
  candidate: string;
  score: number;
  confidence: number;
  probabilities: Record<string, number>;
}

export function renderStoryState(story: PartialStory = {}): string {
  const lines: string[] = ["Current story outline:"];
  if (story.theme) lines.push(`Theme: ${story.theme}`);
  if (story.conflict) lines.push(`Conflict: ${story.conflict}`);
  if (story.plotPoint) lines.push(`Plot point: ${story.plotPoint}`);
  if (story.tone) lines.push(`Tone: ${story.tone}`);
  if (story.ending) lines.push(`Ending: ${story.ending}`);
  if (story.location) lines.push(`Location: ${story.location}`);
  if (story.time) lines.push(`Time: ${story.time}`);
  if (story.characters?.length) {
    lines.push("Characters:");
    for (const c of story.characters) {
      const name = [c.givenName, c.familyName].filter(Boolean).join(" ");
      const attrs = (c.attributes || []).join(", ");
      lines.push(
        `- ${name || "unnamed"}, age ${c.age ?? "?"}, ${c.occupation || "unknown occupation"}${
          attrs ? `; ${attrs}` : ""
        }`
      );
    }
  }
  return lines.join("\n");
}

export function buildJevRequest(opts: {
  story: PartialStory;
  field: RankField | string;
  candidates: string[];
}): JevRequest {
  const { story, field, candidates } = opts;
  const listed = candidates
    .map((c, i) => `[${i}] ${c}`)
    .join("\n");
  const state = `${renderStoryState(story)}\n\nCandidates for field "${field}":\n${listed}`;
  const questions: Record<string, JevQuestion> = {};
  candidates.forEach((candidate, i) => {
    const id = `c${i}`;
    if (isEndingField(field)) {
      questions[id] = {
        type: "noul",
        instructions: `${ENDING_INSTRUCTIONS} Candidate [${i}]: ${candidate}`,
        criteria: ENDING_CRITERIA,
      };
    } else if (isCharacterField(field)) {
      questions[id] = {
        type: "score",
        instructions: `${CHARACTER_INSTRUCTIONS} Candidate [${i}]: ${candidate}`,
        criteria: CHARACTER_LEVELS,
      };
    } else {
      questions[id] = {
        type: "score",
        instructions: `${FIT_INSTRUCTIONS} Candidate [${i}]: ${candidate}`,
        criteria: FIT_LEVELS,
      };
    }
  });
  return { state, model: JEV_MODEL, questions };
}

type JevAnswer = {
  type?: string;
  score?: number;
  noul?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
};

export function rankFromAnswers(
  candidates: string[],
  answers: Record<string, JevAnswer>
): RankedItem[] {
  const items: RankedItem[] = candidates.map((candidate, i) => {
    const a = answers[`c${i}`] || {};
    const score =
      typeof a.score === "number"
        ? a.score
        : typeof a.noul === "number"
          ? a.noul
          : 0;
    return {
      candidate,
      score,
      confidence: typeof a.confidence === "number" ? a.confidence : score,
      probabilities: a.probabilities || {},
    };
  });
  return items.sort((a, b) => b.score - a.score);
}

function softmaxWeights(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

/** Weighted sample without replacement. rng() → [0,1). */
export function sampleTopK(
  ranked: RankedItem[],
  k: number = SAMPLE_K,
  rng: () => number = Math.random
): string[] {
  const pool = ranked.map((r) => ({ ...r }));
  const out: string[] = [];
  const n = Math.min(k, pool.length);
  for (let take = 0; take < n; take++) {
    const weights = softmaxWeights(pool.map((p) => p.score));
    const r = rng();
    let acc = 0;
    let idx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      acc += weights[i];
      if (r <= acc) {
        idx = i;
        break;
      }
    }
    out.push(pool[idx].candidate);
    pool.splice(idx, 1);
  }
  return out;
}

export function fallbackSample(
  candidates: string[],
  k: number = SAMPLE_K,
  rng: () => number = Math.random
): string[] {
  const copy = [...candidates];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(k, copy.length));
}
