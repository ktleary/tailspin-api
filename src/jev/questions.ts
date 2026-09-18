/** Jev question constants for Tailspin suggestion ranking. Keep this file reviewable. */

export const JEV_MODEL = "jev-latest";
export const JEV_TIMEOUT_MS = 3000;
export const SAMPLE_K = 3;

/** Score 0–3: character coherence with theme / tone / existing cast. */
export const CHARACTER_LEVELS = [
  "Belongs in a different story",
  "Bland or duplicative of the existing cast",
  "Coherent but generic",
  "Coherent and creates productive tension with the existing cast and theme",
] as const;

/** Score 0–3: does this option fit what is already chosen? */
export const FIT_LEVELS = [
  "Clashes with the chosen theme, tone, or setting",
  "Mostly unrelated — could be swapped for anything",
  "Fits, but adds little",
  "Fits and sharpens the story already chosen",
] as const;

export const CHARACTER_INSTRUCTIONS =
  "How coherent is this candidate with the current story outline (theme, tone, existing characters)?";

export const FIT_INSTRUCTIONS =
  "Does this candidate fit coherently with what is already chosen in the outline?";

export const ENDING_INSTRUCTIONS =
  "Given this outline, would this ending genuinely catch the reader off guard?";

export const ENDING_CRITERIA = {
  true: "The ending is a genuine surprise that still follows from the outline",
  false: "The ending is obvious, mismatched, or does not twist anything",
};

export type RankField =
  | "characters"
  | "givenName"
  | "familyName"
  | "occupation"
  | "attributes"
  | "ending"
  | "tone"
  | "theme"
  | "conflict"
  | "plotPoint"
  | "location"
  | "time";

export function isCharacterField(field: string): boolean {
  return (
    field === "characters" ||
    field === "givenName" ||
    field === "familyName" ||
    field === "occupation" ||
    field === "attributes"
  );
}

export function isEndingField(field: string): boolean {
  return field === "ending";
}
