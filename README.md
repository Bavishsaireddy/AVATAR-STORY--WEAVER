# Story Weaver

**Story Weaver** is an AI-powered collaborative storytelling prototype where you build breathtaking narratives alongside an AI co-author. It goes far beyond simply "chatting with an LLM"—it's a structured execution of narrative consistency, world-building, and real-time environment generation engineered strictly to ensure the highest quality fiction generation possible.

---

## 🛠️ Setup Instructions

### 1. Prerequisites and Installation
To get started with the project, ensure you have a modern version of Node.js installed (v18 or higher recommended). Next, clone the repository and install the NPM packages.

```bash
npm install
```

### 2. Environment Variables Configuration
To drive the AI engine, you need an API key from Groq, and a Postgres database connected via Prisma. Create a `.env` file in the root directory and supply the following:
```env
# Primary LLM provider (Groq gives us the TTFT speeds needed for smooth UI streaming)
GROQ_API_KEY="gsk_your_api_key_here"

# Standard PostgreSQL connection string (we recommend Neon.tech for serverless databases)
DATABASE_URL="postgresql://your_db_url_here"
```

### 3. Application Launch
You have a few ways to run the setup depending on your use case:

**Development Server:**
Boot up the Turbopack dev server to get hot-reloading.
```bash
npm run dev
```

**Production Build:**
For the most accurate representation of speed and caching.
```bash
npm run build 
npm start
```

**Run Unit Tests:**
We use Vitest to rigorously test our AI normalization and parameter logic.
```bash
npm run test
```

*(Note: Docker configuration was intentionally removed from this project. We wanted to prioritize a fast, simple local build process leveraging native Next.js server handling rather than complicating the evaluation with container networking overhead).*

---

## 🌟 Everything You Can Do Right Now

The application is structured to feel like a gamified narrative product. Here is a definitive breakdown of what is fully functional:

### Story Initialization
- **Set the Stage**: Define your Title, choose from 6 distinct Genres (Fantasy, Sci-Fi, Mystery, Romance, Horror, Comedy), and write your opening hook. The genre governs exactly how the system prompt behaves.
- **Kick off the Narrative**: The AI will natively grab your hook and seamlessly generate the first 150-250 opening words in perfect alignment with your chosen genre rules, refusing to break character.

### The Collaborative Editor
- **Seamless Co-writing**: Type a general direction or explicit dialogue in the prompt box and click "Continue with AI". The AI weaves your input into the story using a gorgeous "Typewriter" streaming effect.
- **Give Me Choices**: Unsure where to take the story? Click a button to ask the AI. It generates three completely distinct narrative branches analyzing immediate consequences. Choose one, and the story continues down that path seamlessly.
- **Conclude Story**: Tells the AI to wrap up all hanging threads, conclude the character arcs, and finish the narrative without any dangling sequel hooks, offering true closure.
- **Undo / Step Back**: Made a mistake or don't like the AI's generation? Uniquely, the project lets you seamlessly roll back the last combined user/AI turn and try a different angle without corrupting state.

### Advanced AI Controls & Utilities
- **Genre Remixing**: Have you ever wondered what the latest Horror paragraph would sound like as a Romantic Comedy? Click a button in the sidebar to dynamically rewrite *only* the last paragraph in the tone of a totally different genre, while keeping the plot canon perfectly intact!
- **Creativity Sliders**: Control the LLM Temperature via a beautifully designed sidebar slider (Precise -> Balanced -> Creative -> Chaotic), tuning the hallucination rate to fit exactly what you need in the moment.
- **Automatic Story Tracking**: 
  - **Dynamic Characters**: Hidden behind the scenes, the AI automatically extracts new names and short descriptions of characters introduced into the story and gracefully pins them to your sidebar in the background.
  - **Story DNA**: The AI maintains a background "tension curve" (1-10 scale), extracts and tracks specific World Rules, limits Open Mysteries, and constantly refreshes a rolling summary paragraph so you (and the AI) never lose the plot.
- **Semantic Toxicity Moderation**: Anything you type is processed completely locally via `@xenova/transformers` safety checks. We protect the LLM from explicit prompts *before* hitting the API to keep the experience completely brand-safe.

### Premium UI/UX Polish & Engineering
The interface of Story Weaver was designed to be immersive, escaping the sterile feeling of a typical ChatGPT-wrapper.
- **Cinematic Genre Themes**: The entire application's mood—colors, typography scales, active borders, and background gradients—dynamically changes depending on which genre you are actively writing in. Soft pastels for Romance; jagged, dark palettes for Horror. We achieve this by mapping complex Tailwind utility clusters to React State.
- **Fluid Micro-Animations**: We chose not to use rigid component libraries. Instead, every transition (opening the sidebar, revealing new characters, streaming in new text, switching themes) is powered by **Framer Motion spring physics** to provide a tactile, organic feel.
- **Rich Text Engine**: Your story is presented in a flexible **Tiptap** editor engine. This gives users absolute semantic control over the formatting rather than forcing them to write raw Markdown.
- **Reading Mode**: Jump into a cinematic full-screen, minimal-distraction mode meant solely to highlight the final prose without any dashboard UI clutter or sidebars.
- **Export Magic**: Built-in Markdown exporting lets you quickly share or save the final artifact to your hard drive.
- **Image Prompter**: A specialized endpoint (`/api/visualize`) built strictly to translate the current story's mood into a highly effective prompt suitable for image generation systems like Midjourney or Flux.

---

## 🏗️ Architecture & Philosophy

### Comprehensive Tech Stack
| Technology Layer | Tool Chosen | Role & Technical Tradeoff |
|------------------|-------------|---------------------------|
| **Core Framework** | **Next.js 16 (App Router)** | Provides our React 19 frontend while securely hiding our API keys in server-side Route Handlers. We rely heavily on App Router's native streaming capabilities. |
| **Database & ORM** | **Prisma** | Schema-driven database safety connected to a PostgreSQL database (Neon). Gives us blistering fast, type-safe query generation without writing raw SQL. |
| **Styling & CSS** | **TailwindCSS v4** | The application specifically avoids heavy, opinionated component libraries like Material UI. Instead, we use Tailwind to craft an entirely bespoke design system via utility classes. |
| **Animations** | **Framer Motion** | Used for cinematic spring animations, stagger effects, and smooth layout transitions (like the sliding sidebar and text reveals). |
| **Rich Text Engine** | **Tiptap** | Powers the core writing area. Superior to Draft.js or Slate for this specific use case because of its headless nature and extensibility. |
| **Sanitization** | **DOMPurify (`isomorphic-dompurify`)** | Security layer. Because we are parsing rich text nodes and inserting HTML from the Tiptap editor, we run rigid DOM sanitization to prevent XSS attacks before pushing blocks to the API or screen. |
| **Local AI (Moderation)** | **Transformers.js (`@xenova/transformers`)** | Runs a local semantic toxicity classification model entirely in the browser/node environment. Protects the LLM from explicit prompts without relying on an external timeout-prone moderation API. |
| **Unique Identifiers** | **UUID `v4`** | Used to generate stable IDs for individual Story Segments, allowing us to perform seamless "Undo" operations and targeted branch choices. |

### API Route Breakdown
Instead of a single monolithic chat endpoint, the application exposes highly modular cognitive endpoints:
- `POST /api/story`: The main streaming gateway for narrative text generation.
- `POST /api/dna`: A strict JSON extraction endpoint responsible for finding world-rules and updating the "Tension" state.
- `POST /api/characters`: Parses raw prose to find newly introduced subjects and formats their descriptions into state cards.
- `POST /api/choices`: Returns exactly three diverse branches when the user hits a writer's block.
- `POST /api/enrich`: A combined endpoint to handle character and DNA updates simultaneously.
- `POST /api/visualize`: Strips narrative and converts it to a purely directive image generation prompt.

---

## 🧠 Which Model / Provider You Used

**Provider:** Groq  
**Model:** `llama-3.3-70b-versatile`  

**Why:** We chose Groq and Llama 3.3 for one incredibly specific reason: blazing fast Time-To-First-Token (TTFT). For a storytelling application where users are relying on the UI to simulate a streaming typewriter, waiting 4-5 seconds for an API to "think" ruins the magic. By routing our logic through Groq's specialized inference, the story generation feels instantaneous, snapping the text onto the screen at native reading speeds.

---

## 📜 Deep Dive into Our System Prompts

To ensure high-quality outputs, our core system prompt avoids being a simple "chat bot" and heavily enforces structural canon. Here is the *exact* core system prompt we dynamically construct for the AI out of multiple templates (`src/lib/prompts.ts`):

### The Core Story Weaver Prompt:
```markdown
You are an elite literary co-author and master of narrative fiction. We are constructing a {genre} story titled "{title}".
Your mandate is to craft breathtaking, atmospheric, and emotionally resonant prose. You do not merely summarize events; you immerse the reader in the scene through acute sensory details, psychological depth, and compelling subtext.

Your absolute highest priority is CANONICAL INTEGRITY. You are bound by a rigid continuity constraint: you must flawlessly weave your prose to honor every prior character trait, established world rule, sensory detail, and past narrative beat without exception. Never contradict established reality.

━━━ STORY IDENTITY ━━━
Title: "{title}"
Genre: {genre}

Original Hook / Setting — **reader-authored opening canon**:
{hook}

Everything concrete in the text above is immutable fact. Your additions must elegantly extend this foundation. You are driving the narrative engine forward—do not merely rehash or tread water.

━━━ GENRE RULES ({genre}) ━━━
{Dynamically injected genre-specific pacing rules}
{Dynamically injected creativity/temperature guidelines}

━━━ ESTABLISHED CHARACTERS (permanent — never rename, retcon, or contradict) ━━━
{Dynamically injected character list}

━━━ ABSOLUTE WRITING RULES ━━━
1. NEVER contradict any previously established fact, character name, trait, relationship, location, or event — consistency is paramount
2. Maintain third-person narrative voice throughout unless the story has already established otherwise
3. Match exactly the tone and atmosphere set in the reader's hook and subsequent paragraphs
4. Write vivid, specific, sensory prose — show emotion through action and detail, never tell
5. When introducing a new character, give them a name immediately
6. End each continuation at a natural narrative pause that creates forward momentum
7. You are a co-author of a novel. Respond ONLY with story prose. No meta-commentary, no "Here is the continuation:", no author notes.
8. Never start a response with "I" or address the reader directly
```

### The Genre Modifiers
To ensure the model actually respects the user's setup, we inject strict boundaries based on the genre chosen:

**Example: Horror injection**
```markdown
- Build dread slowly through atmosphere, sound, and sensory detail
- What the reader imagines is scarier than what you describe — imply, don't explain
- Ground supernatural elements in real emotional fears (loss, isolation, helplessness)
- Use pacing to create tension — slow scenes before sudden terror
- Never fully explain the monster or threat until necessary
```

**Example: Mystery injection**
```markdown
- Plant subtle clues early that will make sense in retrospect
- Build tension through information withheld, not just action
- Every character introduced should have a secret or hidden motivation
- Never reveal the culprit or solution prematurely
- Red herrings should be plausible but ultimately wrong for good reasons
```

### The Conclusion Protocol
A common issue with LLMs in creative writing is their tendency to leave stories open-ended, generating infinite cliffhangers to prolong the chat. When the user clicks the "Conclude Story" button, we override the standard continuation loop and forcefully inject this closure requirement into the prompt:

```markdown
The reader has decided to conclude the story now. Write a satisfying, definitive ending.

Requirements:
- 200–350 words — give it proper weight
- Resolve the main plot thread and the central tension
- Give each established character a meaningful final beat
- End with a resonant final sentence that echoes the story's opening tone
- This is THE END — do not leave threads dangling or hint at continuation
- Make it feel earned and complete
```

### The DNA Extraction Prompt
This is the prompt we hit behind the scenes to power our memory systems:
```markdown
You are a story analyst tracking the narrative DNA of a collaborative fiction story.
Return ONLY valid JSON — no markdown, no backticks, no explanation, just the raw JSON object.

Genre: {genre}
Current story DNA: {existing}
New story text to analyze: "{newText}"

Update the story DNA by:
- runningSummary: 2–4 tight sentences for a reader sidebar — what has happened so far, who matters now, and what is at stake. Refresh the whole recap (not only the new paragraph). Plain prose, no bullets.
- mysteries: unresolved plot threads, open questions, secrets not yet revealed (max 5)
- worldRules: established facts about this world that must never be contradicted (max 5)
- tensionLevel: 1 (calm) to 10 (peak crisis) — current emotional/narrative intensity
- tensionDescription: one sentence summarizing the current dramatic tension
```

### The Running Summarizer Protocol
Notice the `runningSummary` directive inside the DNA Extractor above. When writing a long-form story iteratively, it is incredibly easy for both a human reader and an AI to lose the plot. We implemented an aggressive background summarizer constraint:

> *Refresh the whole recap (not only the new paragraph).*

By forcing the LLM to continuously regenerate a 2-4 sentence macro-summary of the **entire storyline so far**, we achieve two massive wins:
1. **User Experience:** The reader always has a real-time, digestible plot recap pinned to their sidebar.
2. **Context Compression:** If we eventually hook up the Vector Chunking pipeline mentioned in the Future Work section, we can safely truncate the raw chat history array because the `runningSummary` will always carry the absolute truth of the narrative forward inside the System Prompt.

### Dynamic Temperature & Jitter Control
Most LLM integrations hardcode the `temperature` parameter. In our application, we treat Temperature as an exposed UX feature (via the "Creativity" slider: *Precise -> Balanced -> Creative -> Chaotic*). However, setting a flat high temperature for standard prose risks model collapse. To solve this, we implemented two layers of control:

1. **Prompt Grounding**: When a user selects a lower/higher creativity tier, we don't just change the API slider. We dynamically inject explicit constraints into the system prompt (e.g., `Rich imagery and emotional layering are welcome` vs `Prefer lean, concrete sentences; avoid ornament`).
2. **Programmatic Jitter**: We artificially calculate microscopic "jitter" around the base temperature per request. This means that even if a user leaves the slider on "Balanced" (e.g., Temperature 0.65) for 50 turns, the actual API parameter minutely fluctuates between 0.62 and 0.68. This completely prevents the LLM from getting stuck in repetitive syntactical cadences over long chapters, keeping the writing feeling organic.

### Unit Testing the LLM Pipeline
Testing AI applications is traditionally difficult because you cannot always predict the exact string output of an LLM. Rather than relying on flaky functional API tests, we built a **Vitest** suite (`npm run test`) specifically designed to test the mathematical safety nets and JSON normalization boundaries surrounding our AI calls:
- **`normalize.test.ts`**: Proves that if the LLM completely hallucinates a malformed JSON object (e.g., returning `-5` for tension, or forgetting entirely to return the `worldRules` array), our `normalizeDna` function safely intercepts it, patches the missing fields from the fallback state, and strictly clamps outliers without crashing the application.
- **`creativityTemperature.test.ts`**: Proves that our Programmatic Jitter math correctly adheres to bounding limits (such as strictly capping at `1.0` maximum) regardless of randomized mathematical fluctuations.

---

## 💾 Memory & Consistency Strategy

Memory in an LLM context isn't just dumping a massive chat log into the API array. Once the session extends past a few thousand words, models suffer from the "lost in the middle" phenomena. To maintain true narrative consistency locally without blowing our capabilities, we built an extraction strategy called **Story DNA**:

- **Full History Context**: For short-term memory continuity, the entire conversation segment log is formatted as alternating assistant/user messages. This gives the model its immediate grounding.
- **Sidecar Extraction**: Whenever a new AI turn finishes generating on the screen, the client silently fires off debounced background API requests (`/api/dna` and `/api/characters`). This happens entirely separate from the main storytelling thread and is invisible to the user.
- **State Injection**: These background requests force the AI to objectively evaluate the new text and update its perception of the global "Tension Curve", the immutable "World Rules", any new unresolved "Mysteries", and character profiles. 
- **The Loop**: These parsed results are saved into the React state and gracefully injected dynamically into the top of the System Prompt on the *next* turn. By doing this, we explicitly force the LLM to abide by the rules it established chapters earlier, preventing hallucinations and logic breakdowns.

---

## ❌ One Thing That Did Not Work Well At First, And What We Changed

**What broke originally:** Initially, our "Sidecar Extraction" approach caused severe rate-limits and UI latency crashes. The moment the user generated a new story paragraph, our React hook would *simultaneously* fire `Promise.all` requests to `/api/dna` and `/api/characters` to parse the new text on top of managing the stream. Hitting the API with three concurrent heavy inference tasks per interaction immediately bottlenecked the system, degraded stream performance, and triggered 429 warnings from the provider.

**The Fix:** We implemented a graceful debouncing queue system. 
1. First, sidecar extraction waits ~900ms *after* a generation is fully complete before kicking off. 
2. Second, we serialized the extractions instead of running them parallel. 
3. Furthermore, we tied the entire process to a specific "generation counter" hash; if a user hastily clicks "Undo" or generates a new beat *before* the background updates finish, the app automatically cancels the pending Promise outright. This ensures we don't accidentally pollute the main narrative state with outdated story context.

**JSON Formatting Issues:** Additionally, we had major issues getting reliable JSON payloads from the LLM for our sidebar (even with strict JSON prompts, the model would sporadically wrap things in markdown fences like ` ```json `). This broke `JSON.parse()` constantly. We had to implement aggressive regex stripping mechanics (`raw.replace(/```json\n?/g, "")`) across all our API layers to ensure the parsing logic acted defensively and never crashed the frontend.

---

## 🔮 What We Would Build With One More Week

While extremely proud of what we accomplished, here is our product roadmap if we had one more week to polish this into a true venture-backed product:

### 1. Multiplayer Co-Authoring (CRDTs & WebSockets)
Writing doesn't have to be solitary. Because we chose **Tiptap** as our text engine, we are natively prepared to integrate `Yjs`. We would build a real-time multiplayer mode where multiple users can type in the same document, voting on which AI-generated branch the group should take, or taking turns providing the user inputs.

### 2. Audio-Visual Immersion (ElevenLabs & Fal.ai)
We already securely extract characters and tension. Next, we would stream this context into **ElevenLabs** to dynamically cast Voice Actors for the differing character dialogues, providing an interactive, real-time AudioBook experience. Furthermore, we would pipe our `/api/visualize` outputs into **Fal.ai** to natively render the generated world in a sidebar gallery as the user reaches new scenes.

### 3. Infinite Memory via Vector Semantic Chunking (pgvector)
Currently, context scaling is limited by token maximums. We already use PostgreSQL via Neon; we would simply enable the **pgvector** extension. As the story grows past 50,000 words, older segments would be semantically embedded and chunked. The AI would execute RAG (Retrieval-Augmented Generation) on every new turn to magically recall a character introduced 20 chapters ago without passing the entire middle of the book.

### 4. Automatic Lore Codex / Wiki Generation
We are currently generating an ephemeral "Story DNA". We would build a dedicated "Codex" route in the app. As you write, a wiki is dynamically built in the background, generating distinct web pages tracking the lore, magical rules, character relation webs, and chronological timelines, updating without the user having to maintain it manually.

### 5. Persistent State & Export to Kindle (ePub)
Finally, we would wire up **Auth.js** backed by Prisma to allow OAuth saving of multiple story files safely. Once a user triggers the `Conclude Story` sequence, we would package the raw Markdown via a node script into a compliant `.epub` file, wrap it in an AI-generated Cover Art, and deliver a downloadable book ready to be pushed to an e-Reader.

### 6. Node-Based UI for Story Branching
Instead of just maintaining a linear chat feed, we would overhaul the underlying interface into a **Node-based Directed Acyclic Graph (DAG) UI** (similar to Obsidian's canvas or Miro). When a user clicks "Give Me Choices", the UI would physically split into three visual pathways on a canvas. Users could scroll back up, visually see their alternate timelines, and effortlessly jump between different multiverses of their story without losing their place.
