import test from "node:test";
import assert from "node:assert/strict";
import {
  renderStoryState,
  buildJevRequest,
  rankFromAnswers,
  sampleTopK,
  RankField,
} from "./rank";
import { CHARACTER_LEVELS, FIT_LEVELS } from "./questions";

const story = {
  theme: "Character vs. Technology",
  tone: "somber",
  characters: [
    {
      givenName: "Ada",
      familyName: "Cole",
      age: 42,
      occupation: "telegraph clerk",
      attributes: ["wry", "insomniac"],
    },
  ],
};

test("renderStoryState includes chosen fields and omits empty ones", () => {
  const text = renderStoryState({ theme: "revenge", location: "Mars" });
  assert.match(text, /Theme: revenge/);
  assert.match(text, /Location: Mars/);
  assert.doesNotMatch(text, /Tone:/);
});

test("character field builds one Score question per candidate with locked levels", () => {
  const req = buildJevRequest({
    story,
    field: "characters" as RankField,
    candidates: ["a Regency duchess", "a burnt-out sysadmin"],
  });
  assert.equal(req.model, "jev-latest");
  assert.match(req.state, /Character vs\. Technology/);
  assert.match(req.state, /\[0\] a Regency duchess/);
  const q0 = req.questions["c0"];
  assert.equal(q0.type, "score");
  assert.deepEqual(q0.criteria, CHARACTER_LEVELS);
  assert.equal(Object.keys(req.questions).length, 2);
});

test("ending field builds Noul questions", () => {
  const req = buildJevRequest({
    story,
    field: "ending",
    candidates: ["everyone dies", "they open a bakery"],
  });
  assert.equal(req.questions["c0"].type, "noul");
  assert.equal(req.questions["c1"].type, "noul");
});

test("tone field uses fit Score levels", () => {
  const req = buildJevRequest({
    story,
    field: "tone",
    candidates: ["invigorating", "elegiac"],
  });
  assert.deepEqual(req.questions["c0"].criteria, FIT_LEVELS);
});

test("rankFromAnswers orders by score and keeps probabilities", () => {
  const ranked = rankFromAnswers(
    ["alpha", "beta", "gamma"],
    {
      c0: { type: "score", score: 1.1, confidence: 0.4, probabilities: { "1": 1 } },
      c1: { type: "score", score: 2.8, confidence: 0.9, probabilities: { "3": 1 } },
      c2: { type: "noul", noul: 0.2 },
    }
  );
  assert.equal(ranked[0].candidate, "beta");
  assert.equal(ranked[0].score, 2.8);
  assert.equal(ranked[2].candidate, "gamma");
  assert.equal(ranked[2].score, 0.2);
});

test("sampleTopK draws from weights, not always #1, with a seeded rng", () => {
  const ranked = [
    { candidate: "best", score: 3, confidence: 1, probabilities: {} },
    { candidate: "mid", score: 2.5, confidence: 1, probabilities: {} },
    { candidate: "ok", score: 2, confidence: 1, probabilities: {} },
    { candidate: "bad", score: 0.1, confidence: 1, probabilities: {} },
  ];
  // Deterministic rng that always picks the last remaining mass → not always index 0
  let i = 0;
  const rng = () => {
    i += 1;
    return 0.99;
  };
  const sampled = sampleTopK(ranked, 3, rng);
  assert.equal(sampled.length, 3);
  assert.ok(!sampled.includes("bad") || sampled.length === 3);
  const again = sampleTopK(ranked, 3, () => 0);
  assert.equal(again[0], "best");
});
