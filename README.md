# Story Weaver

**Story Weaver** is an AI-powered collaborative storytelling prototype. The human sets the title, genre, and opening hook; the model writes continuations while the app keeps **full story history** on every request, tracks **characters** and **story DNA** in the background, and surfaces **genre-themed** UI, **streaming** prose, and **reading mode** for a product-quality demo.

Built for the **MyAvatar Code Challenge** (product judgment, clean code, thoughtful LLM integration, strong execution—especially **narrative consistency**).

---

## Table of contents

- [What you can do](#what-you-can-do)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Setup](#setup)
- [Running the app](#running-the-app)
- [Environment variables](#environment-variables)
- [API routes](#api-routes)
- [How consistency works](#how-consistency-works)
- [Prompting](#prompting)
- [Client architecture](#client-architecture)
- [Performance and reliability](#performance-and-reliability)
- [Docker](#docker)
- [Known limits and future work](#known-limits-and-future-work)

---

## What you can do

### Story setup

- **Title**, **genre** (Fantasy, Sci-Fi, Mystery, Romance, Horror, Comedy), **initial hook** (textarea).
- **Start the Story** — calls the LLM to generate an opening segment (target length in prompts: roughly **150–250 words** for the opening).

### Main storytelling view

- Scrollable **full story** (user + AI segments).
- Text area for **your next beat**; **Continue with AI** appends model prose (streaming).
- **Give Me Choices** — three branching options; choosing one continues the story along that path.
- **Conclude Story** — model writes a **definitive ending** (prompt enforces closure, no dangling sequel hooks).

### Basic controls

- **Temperature / creativity** slider (sidebar).
- **Genre** badge and **genre-specific “story rules”** baked into the system prompt (see [Prompting](#prompting)).

### Bonus / polish features

| Feature | Description |
|--------|-------------|
| **Cinematic genre themes** | Per-genre colors, borders, typography (`GENRE_THEMES` in `src/types/story.ts`) applied across setup, story, controls, and reading mode. |
| **Streaming “typewriter” prose** | `POST /api/story` returns a streamed text body; the client updates the in-progress AI segment as chunks arrive (throttled for CPU; see [Performance](#performance-and-reliability)). |
| **Character tracker** | After AI turns, background `POST /api/characters` merges new names and short descriptions into state; shown in the sidebar. |
| **Story DNA** | Background `POST /api/dna` extracts open **mysteries**, **world rules**, **tension level** (1–10), and a **tension summary**; injected into later system prompts. |
| **Reading mode** | Full-screen, minimal chrome; Escape or button to exit. |
| **Undo last AI turn** | Removes the latest AI segment (and preceding user segment when applicable). |
| **Export Markdown** | Downloads title, genre, hook, and AI paragraphs as a `.md` file. |
| **Error handling** | Friendly messages for rate limits, invalid keys, and generic failures; `NO_KEY` when no provider is configured. |

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | **Next.js 16** (App Router) |
| UI | **React 19**, **TypeScript 5** |
| Styling | **Tailwind CSS 4** (`@tailwindcss/postcss`) |
| IDs | **uuid** (`v4`) for stable segment IDs |
| Linting | **ESLint 9** with `eslint-config-next` |
| LLM (primary) | **Anthropic Messages API** — model **`claude-3-sonnet-20240229`** (streaming for story, non-streaming for auxiliary routes) |
| LLM (fallback) | **Groq** OpenAI-compatible chat — **`llama-3.3-70b-versatile`** (used if Anthropic fails for non-auth reasons, e.g. model availability) |
| Deployment artifact | **`output: "standalone"`** in `next.config.ts` for Docker-friendly production output |

API keys never ship to the browser: all model calls run in **Route Handlers** under `src/app/api/`.

---

## Repository layout

```
story-weaver/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── story/route.ts      # Streaming continuation / start / choice / conclude
│   │   │   ├── choices/route.ts    # JSON: three branching options
│   │   │   ├── characters/route.ts # JSON: updated character list
│   │   │   └── dna/route.ts        # JSON: Story DNA update
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                # Setup vs story view switch
│   ├── components/
│   │   ├── SetupScreen.tsx
│   │   ├── StoryView.tsx
│   │   ├── StorySegment.tsx
│   │   ├── ActionBar.tsx
│   │   ├── ChoiceCards.tsx
│   │   ├── Controls.tsx
│   │   ├── CharacterTracker.tsx
│   │   ├── StoryDNA.tsx
│   │   ├── ReadingMode.tsx
│   │   └── ErrorBanner.tsx
│   ├── hooks/
│   │   └── useStory.ts             # State, streaming reader, enrichment scheduling
│   ├── lib/
│   │   ├── anthropicClient.ts      # callClaude, streamClaude
│   │   ├── groqClient.ts           # callGroq, streamGroq
│   │   └── prompts.ts              # System/user builders, choices, characters, DNA
│   └── types/
│       └── story.ts                # Types, StoryRequest, GENRE_THEMES, etc.
├── Dockerfile                      # Multi-stage Node 20 Alpine → standalone server
├── docker-compose.yml              # Production container on port 3000
├── next.config.ts                  # standalone + turbopack.root (lockfile warning fix)
├── package.json
└── README.md
```

---

## Setup

```bash
cd story-weaver
npm install
```

Create **`.env.local`** in the project root (see [Environment variables](#environment-variables)).

---

## Running the app

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server (Turbopack). Port **3000** by default; another process may bump you to **3001**. |
| `npm run build` | Production build. |
| `npm run start` | Serves the production build (run `build` first). |
| `npm run preview` | `next build && next start` — good when you want a **lighter** session than `dev`. |
| `npm run lint` | ESLint. |

Open **http://localhost:3000** (or the port shown in the terminal).

---

## Environment variables

| Variable | Required | Role |
|----------|----------|------|
| `ANTHROPIC_API_KEY` | One of the two | Primary provider for all routes. |
| `GROQ_API_KEY` | One of the two | Fallback when Anthropic streaming fails (except explicit rate limit / invalid key). |

Placeholder values containing `your_` are ignored so you can commit a template safely.

Example `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
GROQ_API_KEY=gsk_...
```

Restart the dev server after changing env vars.

---

## API routes

| Method & path | Body (JSON) | Response |
|---------------|-------------|----------|
| `POST /api/story` | `StoryRequest`: `title`, `genre`, `hook`, `segments`, `characters`, `temperature`, `mode` (`start` \| `continue` \| `choice` \| `conclude`), optional `userInput`, `choiceDescription` | **Stream**: `text/plain` deltas for the new AI segment. Errors: JSON `RATE_LIMIT`, `INVALID_KEY`, `NO_KEY`, etc. |
| `POST /api/choices` | Story context + segments (see route) | JSON `{ choices: StoryChoice[] }` (three items). |
| `POST /api/characters` | `characters`, `newText` | JSON `{ characters: Character[] }`. |
| `POST /api/dna` | `dna`, `newText`, `genre` | JSON `{ dna: StoryDNA }`. |

Auxiliary routes use the same **Anthropic → Groq** fallback pattern as `story` (where implemented in each file).

---

## How consistency works

1. **Full history** — Every story call sends the complete `segments` array, converted to alternating user/assistant messages via `buildAnthropicMessages` in `src/lib/prompts.ts` (consecutive user lines are merged where needed).

2. **System prompt** — Built per request with `buildSystemPrompt`: genre rules, hook, title, and the current **character list** plus **Story DNA** (mysteries, world rules, tension) so the model sees explicit constraints, not only raw chat.

3. **Background analysts** — After a successful streamed AI turn, the client schedules **debounced** enrichment: first **characters**, then **DNA**, **sequentially** (reduces parallel load and rate-limit pressure). Rapid new turns **cancel** pending enrichment so jobs do not stack.

---

## Prompting

All templates live in **`src/lib/prompts.ts`**.

- **`GENRE_RULES`** — Per-genre guidance (tone, pacing, what to avoid).
- **`buildSystemPrompt`** — Assembles rules + hook + characters + DNA block.
- **`buildContinuationUserMessage`** — Mode-specific user instructions (`start`, `continue`, `choice`, `conclude` with ending constraints).
- **`CHOICES_SYSTEM_PROMPT`** / **`buildChoicesUserPrompt`** — Exactly three distinct branches.
- **`CHARACTERS_SYSTEM_PROMPT`** / **`buildCharactersUserPrompt`** — JSON-shaped character merge.
- **`DNA_SYSTEM_PROMPT`** / **`buildDNAUserPrompt`** — JSON for mysteries, world rules, tension.

The main story call is tuned for **prose**; auxiliary calls use **lower temperature** where set in routes for more stable JSON-ish outputs.

---

## Client architecture

- **`page.tsx`** — Renders `SetupScreen` when `phase === "setup"`, else `StoryView`.
- **`useStory`** — Single source of truth for `StoryState`: segments, characters, `dna`, `pendingChoices`, `phase`, loading, errors, temperature.
- **Streaming** — `streamStoryResponse` reads `response.body` with `ReadableStreamDefaultReader`, accumulates text, updates the placeholder AI segment; updates are **throttled** (~150ms) to limit re-renders.
- **Reading mode** — Local `useState` in `StoryView` toggles `ReadingMode` overlay.

---

## Performance and reliability

- **Streaming throttle** — Avoids a React setState on every network chunk (reduces CPU spikes on low-end machines).
- **Debounced enrichment** (~900ms) + **generation counter** — Cancels outdated enrichment when the user starts a new turn; runs characters then DNA **one after the other** instead of two parallel LLM calls immediately after every response.
- **Rate limits** — Surfaces a wait message using `retryAfter` when the API returns 429-style errors.
- **Invalid key** — Distinct messaging for authentication failures.

---

## Docker

The **`Dockerfile`** builds the app and runs the **Next.js standalone** `server.js` on port **3000**.

```bash
docker compose build
docker compose up
```

`docker-compose.yml` loads **`.env.local`** for API keys. A container still uses **your machine’s CPU/RAM**; it mainly standardizes a **production** run (often lighter than `npm run dev`).

---

## Known limits and future work

- **Context length** — Very long stories will eventually hit model context limits. A rolling **summary** of older segments would be the next scaling step.
- **Persistence** — State is in-memory on the client; refresh loses the session unless you add **localStorage** or a backend store.
- **Genre remix / image prompts** — Were experimented with earlier; the shipped UI focuses on core storytelling + DNA + characters. Similar features could return as optional endpoints with clear UI toggles.

---

## License

Private project for challenge / portfolio use unless otherwise stated.
