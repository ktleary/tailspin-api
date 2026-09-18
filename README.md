# Tailspin API

Backend for [tailspin.fun](https://tailspin.fun/) — generates short stories from a user-assembled outline.

## Architecture

1. The client sends a **partial story** (theme, characters, tone, ending, …) plus a candidate pool to `POST /api/v1/rank-suggestions`.
2. One [Jev](https://docs.typesafe.ai) (`jev-latest`) call scores those candidates for coherence with the outline (Score for characters/tone/etc., Noul for endings) and the API **samples top-k from the score distribution** (not argmax).
3. The user picks from those ranked suggestions.
4. `POST /api/v1/create-story` sends the full `Story` to an OpenAI-compatible endpoint. The prompt treats every field as a constraint and matches voice/pacing to **tone** (no default wit).

If Jev is down, times out (>3s), or the key is missing, rank-suggestions still returns HTTP 200 with `degraded: true` and a random sample so the client can fall back.

## API

- `POST /api/v1/create-story` — body `{ story: Story }` → `{ story: string }`
- `POST /api/v1/rank-suggestions` — body `{ story: Partial<Story>, field: string, candidates: string[] }` → `{ ranked, sampled, degraded }`

## Models

### Character

```typescript
interface Character {
  givenName: string;
  familyName: string;
  age: number;
  attributes: string[];
  occupation: string;
}
```

### Story

```typescript
interface Story {
  theme: string;
  characters: Character[];
  location: string;
  time: string;
  plotPoint: string;
  conflict: string;
  ending: string;
  tone: string;
}
```

## Getting Started

```bash
git clone git@github.com:ktleary/tailspin-api.git
cd tailspin-api
yarn install
```

Env (see `.env.example`): `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `PORT`, `TYPESAFE_API_KEY`.

```bash
yarn build
node dist/src/app.js
```

Default port is 3000 (`PORT`).

## License

GPL-3.0-or-later.
