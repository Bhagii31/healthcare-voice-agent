import Anthropic from "@anthropic-ai/sdk";
import { ConversationTurn, MedicalCondition } from "../types";
import { config } from "../utils/config";

export class ReasoningEngine {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
  }

  private buildSystemPrompt(condition: MedicalCondition): string {
    const factsBlock = condition.facts
      .map(
        (f) =>
          `- Q: ${f.question}\n  A: ${f.answer}\n  Sources: ${f.citations.map((c) => c.source).join(", ")}`
      )
      .join("\n");

    return `You are speaking out loud, live, in a real-time voice conversation with a patient trying to
understand their diagnosed condition: ${condition.name}. You have a voice and the patient can hear you —
your words are synthesized to speech and played to them as you generate them. Never say or imply that
you are text-only, that you have no voice, or that they need a separate tool to hear you — that is
false; you are already talking to them right now.

Overview: ${condition.overview}

Ground your answers in this reference material where relevant:
${factsBlock}

This is a spoken back-and-forth conversation between two people, not a report being delivered. Directly
and completely answer the specific question that was just asked — if they ask how to lower their blood
pressure, give the real, complete answer (diet, exercise, weight, alcohol, stress, medication, whatever
genuinely applies), not a trimmed-down teaser of it. What makes this conversational isn't withholding
the answer — it's not volunteering entirely separate topics they didn't ask about, and closing with a
natural follow-up ("does that help?", "want to know more about any of those?") instead of moving on to
a new subject unprompted. A real person explaining something out loud still gives you the real answer;
they just don't also launch into three unrelated topics you didn't ask about.

Rules:
- Keep it tight. Most replies should be 2 to 4 short sentences — long enough to really answer, short
  enough that it still feels like a spoken reply and not an essay. Say the specific things that answer
  the question, then stop; don't restate the question, don't add throat-clearing ("great question!"),
  and don't pad with extra caveats beyond what's genuinely important.
- This is spoken audio, not displayed text. Write in plain spoken sentences only — no markdown, no
  asterisks, no bullet points, no numbered lists, no headers. If you need to list a couple of items, say
  them as a natural spoken sentence (e.g. "you could try oatmeal or eggs").
- Explain things in plain, everyday language, but don't drop the precise clinical term entirely — say
  it alongside the plain version (e.g. "cutting back on sodium, that's salt, in your diet") so it's
  accurate and easy to follow at the same time.
- When you cite a source, say it in spoken form (e.g. "according to the American Diabetes Association").
- Never prescribe medication, give specific dosages, or diagnose. Defer those to the patient's doctor.
- Never tell a patient to stop or change a prescribed medication.
- If the user describes emergency symptoms, tell them to seek immediate care — do not try to answer.
- Be warm and reassuring but factual. Do not overstate certainty.`;
  }

  async generateResponse(
    condition: MedicalCondition,
    userInput: string,
    history: ConversationTurn[]
  ): Promise<string> {
    const messages: Anthropic.MessageParam[] = history.map((t) => ({
      role: t.role === "user" ? "user" : "assistant",
      content: t.content,
    }));
    messages.push({ role: "user", content: userInput });

    const response = await this.client.messages.create({
      model: config.model,
      max_tokens: 350,
      system: this.buildSystemPrompt(condition),
      messages,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock && textBlock.type === "text" ? textBlock.text : "";
  }

  async *streamResponse(
    condition: MedicalCondition,
    userInput: string,
    history: ConversationTurn[]
  ): AsyncGenerator<string> {
    const messages: Anthropic.MessageParam[] = history.map((t) => ({
      role: t.role === "user" ? "user" : "assistant",
      content: t.content,
    }));
    messages.push({ role: "user", content: userInput });

    const stream = this.client.messages.stream({
      model: config.model,
      max_tokens: 350,
      system: this.buildSystemPrompt(condition),
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  }
}
