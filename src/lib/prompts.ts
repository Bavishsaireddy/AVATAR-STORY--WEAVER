import type {
  Genre,
  Character,
  StorySegment,
  StoryMode,
  StoryDNA,
  CreativityPreference,
} from "@/types/story";
import type { GroqMessage } from "./groqClient";
import { htmlToPlainText } from "./htmlToPlainText";

const GENRE_RULES: Record<Genre, string> = {
  Fantasy: `
- Build a rich, internally consistent world with its own rules, magic systems, and history
- Magic must follow consistent rules established early — never introduce new powers conveniently
- Use vivid, evocative language for world-building details
- Avoid modern slang or technological references unless part of the world
- Heroes face real moral dilemmas; villains have comprehensible motivations`.trim(),

  "Sci-Fi": `
- Ground all technology in logical extrapolation — explain how things work, briefly
- Maintain scientific plausibility even when speculative
- Favor a sense of wonder, discovery, and the vastness of the universe
- Explore the human consequences of technology and social change
- Keep the timeline and physics consistent throughout`.trim(),

  Mystery: `
- Plant subtle clues early that will make sense in retrospect
- Build tension through information withheld, not just action
- Every character introduced should have a secret or hidden motivation
- Never reveal the culprit or solution prematurely
- Red herrings should be plausible but ultimately wrong for good reasons`.trim(),

  Romance: `
- Focus on emotional tension, longing, and the slow development of connection
- Show chemistry through small gestures, meaningful glances, and subtext
- Slow burn beats rushed resolution — tension is the engine
- Internal emotional states are as important as external action
- Conflict should stem from character, not contrived misunderstandings`.trim(),

  Horror: `
- Build dread slowly through atmosphere, sound, and sensory detail
- What the reader imagines is scarier than what you describe — imply, don't explain
- Ground supernatural elements in real emotional fears (loss, isolation, helplessness)
- Use pacing to create tension — slow scenes before sudden terror
- Never fully explain the monster or threat until necessary`.trim(),

  Comedy: `
- Use timing, subverted expectations, and character quirks as the core comedic tools
- Let humor arise naturally from character and situation, not forced jokes
- The best comedy has an undercurrent of truth or pathos
- Never explain or announce that something is funny
- Absurdist logic should be internally consistent — commit to the bit`.trim(),
};

const CREATIVITY_GUIDANCE: Record<CreativityPreference, string> = {
  precise: `The reader chose **Precise** narrative style (server maps this to sampling temperature).
- Prefer lean, concrete sentences; avoid ornament that does not advance scene or character.
- Keep cause-and-effect crisp; minimize digression.`,
  balanced: `The reader chose **Balanced** narrative style.
- Mix clear forward motion with selective sensory and emotional detail.
- Neither sparse nor overwrought.`,
  creative: `The reader chose **Creative** narrative style.
- Richer imagery, metaphor, and emotional layering are welcome when they serve the moment.
- Still obey every canon fact and genre rule.`,
  chaotic: `The reader chose **Chaotic** narrative style.
- Allow bolder tonal swings and more surprising beats while staying internally consistent with prior prose.
- Never break established names, facts, or timeline without cause in the text.`,
};

export function buildSystemPrompt({
  title,
  genre,
  hook,
  characters,
  creativityPreference,
}: {
  title: string;
  genre: Genre;
  hook: string;
  characters: Character[];
  creativityPreference?: CreativityPreference;
}): string {
  const characterList =
    characters.length > 0
      ? characters.map((c) => `  • ${c.name}: ${c.description}`).join("\n")
      : "  No named characters established yet.";

  const creativityBlock =
    creativityPreference && CREATIVITY_GUIDANCE[creativityPreference]
      ? `\n━━━ READER'S NARRATIVE STYLE (${creativityPreference}) ━━━\n${CREATIVITY_GUIDANCE[creativityPreference]}\n`
      : "";

  return `You are an elite literary co-author and master of narrative fiction. We are constructing a ${genre} story titled "${title}".
Your mandate is to craft breathtaking, atmospheric, and emotionally resonant prose. You do not merely summarize events; you immerse the reader in the scene through acute sensory details, psychological depth, and compelling subtext.

Your absolute highest priority is CANONICAL INTEGRITY. You are bound by a rigid continuity constraint: you must flawlessly weave your prose to honor every prior character trait, established world rule, sensory detail, and past narrative beat without exception. Never contradict established reality.

━━━ STORY IDENTITY ━━━
Title: "${title}"
Genre: ${genre}

Original Hook / Setting — **reader-authored opening canon**:
${hook}

Everything concrete in the text above is immutable fact. Your additions must elegantly extend this foundation. You are driving the narrative engine forward—do not merely rehash or tread water.

━━━ GENRE RULES (${genre}) ━━━
${GENRE_RULES[genre]}
${creativityBlock}
━━━ ESTABLISHED CHARACTERS (permanent — never rename, retcon, or contradict) ━━━
${characterList}

━━━ ABSOLUTE WRITING RULES ━━━
1. NEVER contradict any previously established fact, character name, trait, relationship, location, or event — consistency is paramount
2. Maintain third-person narrative voice throughout unless the story has already established otherwise
3. Match exactly the tone and atmosphere set in the reader's hook and subsequent paragraphs
4. Write vivid, specific, sensory prose — show emotion through action and detail, never tell
5. When introducing a new character, give them a name immediately
6. End each continuation at a natural narrative pause that creates forward momentum
7. You are a co-author of a novel. Respond ONLY with story prose. No meta-commentary, no "Here is the continuation:", no author notes.
8. Never start a response with "I" or address the reader directly`.trim();
}

export function buildContinuationUserMessage(
  mode: StoryMode,
  userInput?: string,
  choiceDescription?: string,
  opts?: { startFromHookPlain?: string }
): string {
  if (mode === "conclude") {
    return `The reader has decided to conclude the story now. Write a satisfying, definitive ending.

Requirements:
- 200–350 words — give it proper weight
- Resolve the main plot thread and the central tension
- Give each established character a meaningful final beat
- End with a resonant final sentence that echoes the story's opening tone
- This is THE END — do not leave threads dangling or hint at continuation
- Make it feel earned and complete`;
  }

  if (mode === "start") {
    const h = opts?.startFromHookPlain?.trim() ?? "";
    if (h.length > 0) {
      const clip = h.length > 4000 ? `${h.slice(0, 4000)}\n…` : h;
      return `The reader has **already written the opening** of this story. Treat it as the first on-page prose — established canon, not a summary to ignore.

Their opening (continue from here — same scene, voice, POV, and stakes; do not restart with a conflicting cold open):

"""
${clip}
"""

Your task:
- **Continue directly** from the last sentence's moment. No time jumps or scene resets unless their text already implies one.
- Add roughly **150–250 words** of new prose that flows as the natural next beat (do not paste their lines back verbatim).
- Preserve every named detail, place, and mood they introduced.
- End at a paragraph break that pulls the reader forward.`;
    }
    return `Write the opening of this story. Requirements:
- 150–250 words
- Immediately establish the world, atmosphere, and at least one compelling character
- End at a natural paragraph break that hooks the reader and creates forward momentum
- Make the first sentence unforgettable`;
  }

  if (mode === "choice" && choiceDescription) {
    return `Continue the story following this chosen path: "${choiceDescription}"

Write 2 vivid paragraphs (150–200 words total). End at a moment of tension or decision that invites the next contribution.`;
  }

  if (userInput && userInput.trim()) {
    const plain = htmlToPlainText(userInput.trim());
    return `The reader has contributed the following to the story:

"${plain}"

Incorporate this naturally into the narrative and continue with 1–2 paragraphs that build on it. Stay completely consistent with all established story elements.`;
  }

  return `Continue the story with 1–2 vivid paragraphs (120–220 words). Advance the plot meaningfully. End at a compelling narrative pause.`;
}

export function buildRemixSystemPrompt({
  title,
  storyGenre,
  targetGenre,
  hook,
  characters,
}: {
  title: string;
  storyGenre: Genre;
  targetGenre: Genre;
  hook: string;
  characters: Character[];
}): string {
  const characterList =
    characters.length > 0
      ? characters.map((c) => `  • ${c.name}: ${c.description}`).join("\n")
      : "  No named characters established yet.";

  return `You are a masterful collaborative storyteller. The ongoing story "${title}" is canonically **${storyGenre}** fiction.

The reader asked for a **genre remix**: rewrite ONLY your latest story paragraph so it reads as **${targetGenre}** — voice, imagery, tropes, and pacing — while the story's actual canon and genre remain ${storyGenre}.

━━━ ORIGINAL HOOK (canon — do not contradict) ━━━
${hook}

━━━ TARGET GENRE VOICE (${targetGenre}) — apply to this rewrite only ━━━
${GENRE_RULES[targetGenre]}

━━━ ESTABLISHED CHARACTERS (keep names, relationships, and facts identical) ━━━
${characterList}

━━━ REMIX RULES ━━━
1. Rewrite ONLY your immediately previous assistant message in this thread — no earlier beats.
2. Preserve every plot event, cause, effect, revelation, and ending beat. Do not add or remove story turns.
3. Keep length within roughly ±25% of the original.
4. Output ONLY the rewritten prose — no headings, quotes, or explanation.
5. Match narrative person and tense to the passage you are rewriting unless a shift is required for clarity.`.trim();
}

export function buildRemixUserMessage(targetGenre: Genre): string {
  return `Perform the remix now: recast your previous reply as ${targetGenre} fiction (tone, diction, atmosphere) while keeping the same story substance beat-for-beat.`.trim();
}

export function buildLlmMessages(
  segments: StorySegment[],
  newUserMessage: string
): GroqMessage[] {
  const messages: GroqMessage[] = [];

  for (const seg of segments) {
    const role: "user" | "assistant" = seg.role === "ai" ? "assistant" : "user";
    const last = messages[messages.length - 1];
    const content = htmlToPlainText(seg.text);

    if (last && last.role === role) {
      last.content += "\n\n" + content;
    } else {
      messages.push({ role, content });
    }
  }

  const lastMsg = messages[messages.length - 1];
  if (lastMsg && lastMsg.role === "user") {
    lastMsg.content += "\n\n" + newUserMessage;
  } else {
    messages.push({ role: "user", content: newUserMessage });
  }

  return messages;
}

export const CHOICES_SYSTEM_PROMPT = `You are a story branching specialist working on a collaborative fiction project.
Your job is to generate 3 meaningfully distinct branching paths for a story.
Return ONLY valid JSON — no markdown, no backticks, no explanation, just the raw JSON object.`;

export function buildChoicesUserPrompt(): string {
  return `Based on the story so far, generate exactly 3 distinct branching paths the story could take next.

The choices must be meaningfully different — not just variations of the same idea. Think: different stakes, different character focuses, different tones.

Return ONLY this exact JSON format:
{
  "choices": [
    { "id": 1, "title": "Short title (5 words max)", "description": "Two sentences: what happens and what tension or consequence this creates." },
    { "id": 2, "title": "Short title (5 words max)", "description": "Two sentences: what happens and what tension or consequence this creates." },
    { "id": 3, "title": "Short title (5 words max)", "description": "Two sentences: what happens and what tension or consequence this creates." }
  ]
}`;
}

export const CHARACTERS_SYSTEM_PROMPT = `You are a story analyst. Extract and maintain a list of named characters from story text.
Return ONLY valid JSON — no markdown, no backticks, no explanation.`;

// ─── Story DNA ───────────────────────────────────────────────────────────────

export const DNA_SYSTEM_PROMPT = `You are a story analyst tracking the narrative DNA of a collaborative fiction story.
Return ONLY valid JSON — no markdown, no backticks, no explanation, just the raw JSON object.`;

export function buildDNAUserPrompt(
  existingDNA: StoryDNA | null,
  newText: string,
  genre: Genre
): string {
  const existing = existingDNA ? JSON.stringify(existingDNA) : "null";
  return `Genre: ${genre}
Current story DNA: ${existing}

New story text to analyze:
"${newText}"

Update the story DNA by:
- runningSummary: 2–4 tight sentences for a reader sidebar — what has happened so far, who matters now, and what is at stake. Refresh the whole recap (not only the new paragraph). Plain prose, no bullets.
- mysteries: unresolved plot threads, open questions, secrets not yet revealed (max 5)
- worldRules: established facts about this world that must never be contradicted (max 5)
- tensionLevel: 1 (calm) to 10 (peak crisis) — current emotional/narrative intensity
- tensionDescription: one sentence summarizing the current dramatic tension

Return ONLY this JSON:
{
  "runningSummary": "Two to four sentences covering the full story beat-by-beat so far.",
  "mysteries": ["string", "string"],
  "worldRules": ["string", "string"],
  "tensionLevel": 5,
  "tensionDescription": "One sentence describing current tension."
}`;
}

export function buildCharactersUserPrompt(
  existingCharacters: Character[],
  newText: string
): string {
  const existing = JSON.stringify(existingCharacters);
  return `Current known characters: ${existing}

New story text to analyze:
"${newText}"

Update the character list by:
- Adding any newly named characters with a one-sentence description
- Updating descriptions if new information is revealed
- Keeping all existing characters intact

Return the complete updated list:
{
  "characters": [
    { "name": "Full Name", "description": "One sentence: their role, key personality trait, and relationship to others." }
  ]
}`;
}

// ─── Combined sidebar enrich (characters + DNA in one request) ───────────────

export const ENRICH_SIDEBAR_SYSTEM_PROMPT = `You are a story analyst. In one pass, update the character roster AND narrative DNA from new prose.

Rules:
- Output a single JSON object only — no markdown fences, no commentary before or after.
- "mysteries" and "worldRules" MUST be JSON arrays of strings (use [] if none).
- "characters" MUST be a JSON array of objects with "name" and "description" strings.
- "dna.runningSummary" MUST be 2–4 sentences of plain prose (never empty if there is story text).`;

export function buildEnrichSidebarUserPrompt(
  characters: Character[],
  existingDNA: StoryDNA | null,
  newText: string,
  genre: Genre
): string {
  const clip = newText.length > 12000 ? `${newText.slice(0, 12000)}\n…` : newText;
  return `Genre: ${genre}

Current characters (JSON): ${JSON.stringify(characters)}
Current story DNA (JSON): ${existingDNA ? JSON.stringify(existingDNA) : "null"}

New story text to merge in:
"""
${clip}
"""

1. characters — add or update named characters; one-sentence descriptions; keep prior characters unless retconned in new text.
2. dna.runningSummary — 2–4 sentences, full recap so far (not just this paragraph). Plain prose.
3. dna.mysteries — max 5 open threads. dna.worldRules — max 5 canon facts. dna.tensionLevel 1–10. dna.tensionDescription one sentence.

Return ONLY:
{
  "characters": [ { "name": "Full Name", "description": "One sentence." } ],
  "dna": {
    "runningSummary": "Two to four sentences.",
    "mysteries": ["string"],
    "worldRules": ["string"],
    "tensionLevel": 5,
    "tensionDescription": "One sentence."
  }
}`;
}

// ─── Visual Prompt Generation ──────────────────────────────────────────────

export const VISUALIZE_SYSTEM_PROMPT = `You are an expert prompt engineer for cutting-edge text-to-image AI models (Midjourney, Flux, DALL-E 3).
Your task: read a story passage and write one highly detailed, cinematic image-generation prompt that captures the exact mood, subject, and lighting of the scene.

Rules:
- Output ONLY the raw prompt text. No quotes, no preamble, no "Here is your prompt:", no explanation.
- Maximum 60 words. Focus on vivid subject nouns, color palette, lighting quality, camera angle, and atmosphere.
- Do NOT include character names — describe appearance and role instead.`;

export function buildVisualizeUserPrompt(
  text: string,
  genre: Genre,
  dna: StoryDNA | null,
  characters: Character[]
): string {
  const charDescriptions =
    characters.length > 0
      ? characters.map((c) => `${c.name}: ${c.description}`).join("; ")
      : "None established";
  return `Genre: ${genre}
Story tension: ${dna?.tensionDescription ?? "Unknown"}
Characters present: ${charDescriptions}

Story passage to visualize:
"""
${text}
"""`;
}
