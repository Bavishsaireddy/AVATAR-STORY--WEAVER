import type { Genre, Character, StorySegment, StoryMode, StoryDNA } from "@/types/story";
import type { AnthropicMessage } from "./anthropicClient";

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

export function buildSystemPrompt({
  title,
  genre,
  hook,
  characters,
}: {
  title: string;
  genre: Genre;
  hook: string;
  characters: Character[];
}): string {
  const characterList =
    characters.length > 0
      ? characters.map((c) => `  • ${c.name}: ${c.description}`).join("\n")
      : "  No named characters established yet.";

  return `You are a masterful collaborative storyteller co-writing a ${genre} story titled "${title}".

━━━ STORY IDENTITY ━━━
Title: "${title}"
Genre: ${genre}
Original Hook / Setting:
${hook}

━━━ GENRE RULES (${genre}) ━━━
${GENRE_RULES[genre]}

━━━ ESTABLISHED CHARACTERS (permanent — never rename, retcon, or contradict) ━━━
${characterList}

━━━ ABSOLUTE WRITING RULES ━━━
1. NEVER contradict any previously established fact, character name, trait, relationship, location, or event — consistency is paramount
2. Maintain third-person narrative voice throughout unless the story has already established otherwise
3. Match exactly the tone and atmosphere set in the opening paragraphs
4. Write vivid, specific, sensory prose — show emotion through action and detail, never tell
5. When introducing a new character, give them a name immediately
6. End each continuation at a natural narrative pause that creates forward momentum
7. You are a co-author of a novel. Respond ONLY with story prose. No meta-commentary, no "Here is the continuation:", no author notes.
8. Never start a response with "I" or address the reader directly`.trim();
}

export function buildContinuationUserMessage(
  mode: StoryMode,
  userInput?: string,
  choiceDescription?: string
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
    return `The reader has contributed the following to the story:

"${userInput.trim()}"

Incorporate this naturally into the narrative and continue with 1–2 paragraphs that build on it. Stay completely consistent with all established story elements.`;
  }

  return `Continue the story with 1–2 vivid paragraphs (120–220 words). Advance the plot meaningfully. End at a compelling narrative pause.`;
}

export function buildAnthropicMessages(
  segments: StorySegment[],
  newUserMessage: string
): AnthropicMessage[] {
  const messages: AnthropicMessage[] = [];

  for (const seg of segments) {
    const role: "user" | "assistant" = seg.role === "ai" ? "assistant" : "user";
    const last = messages[messages.length - 1];

    if (last && last.role === role) {
      last.content += "\n\n" + seg.text;
    } else {
      messages.push({ role, content: seg.text });
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
- mysteries: unresolved plot threads, open questions, secrets not yet revealed (max 5)
- worldRules: established facts about this world that must never be contradicted (max 5)
- tensionLevel: 1 (calm) to 10 (peak crisis) — current emotional/narrative intensity
- tensionDescription: one sentence summarizing the current dramatic tension

Return ONLY this JSON:
{
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

