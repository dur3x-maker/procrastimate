export type ToneCategory = 
    | "idle"
    | "moderate"
    | "overheating"
    | "absurd";

export const tonePacks: Record<ToneCategory, string[]> = {
  idle: [
    "tone.idle.1",
    "tone.idle.2",
    "tone.idle.3",
    "tone.idle.4",
    "tone.idle.5",
    "tone.idle.6",
    "tone.idle.7",
    "tone.idle.8",
    "tone.idle.9",
    "tone.idle.10",
    "tone.idle.11",
    "tone.idle.12",
  ],
  moderate: [
    "tone.moderate.1",
    "tone.moderate.2",
    "tone.moderate.3",
    "tone.moderate.4",
    "tone.moderate.5",
    "tone.moderate.6",
    "tone.moderate.7",
    "tone.moderate.8",
    "tone.moderate.9",
    "tone.moderate.10",
    "tone.moderate.11",
    "tone.moderate.12",
  ],
  overheating: [
    "tone.overheating.1",
    "tone.overheating.2",
    "tone.overheating.3",
    "tone.overheating.4",
    "tone.overheating.5",
    "tone.overheating.6",
    "tone.overheating.7",
    "tone.overheating.8",
    "tone.overheating.9",
    "tone.overheating.10",
    "tone.overheating.11",
    "tone.overheating.12",
  ],
  absurd: [
    "tone.absurd.1",
    "tone.absurd.2",
    "tone.absurd.3",
    "tone.absurd.4",
    "tone.absurd.5",
    "tone.absurd.6",
    "tone.absurd.7",
    "tone.absurd.8",
    "tone.absurd.9",
    "tone.absurd.10",
    "tone.absurd.11",
    "tone.absurd.12",
  ],
};
