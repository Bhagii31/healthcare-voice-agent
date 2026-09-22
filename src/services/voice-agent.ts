import { AgentResponse, Citation, Session, StreamEvent } from "../types";
import { findCondition, findRelevantFacts } from "./medical-kb";
import {
  checkUserInputSafety,
  checkResponseSafety,
  EMERGENCY_RESPONSE,
  PRESCRIBING_DECLINE_RESPONSE,
} from "./safety-filter";
import { ReasoningEngine } from "./reasoning-engine";
import { StateManager } from "./state-manager";

export class VoiceAgent {
  private reasoningEngine: ReasoningEngine;
  private stateManager: StateManager;

  constructor(stateManager?: StateManager) {
    this.reasoningEngine = new ReasoningEngine();
    this.stateManager = stateManager ?? new StateManager();
  }

  startSession(conditionId: string): Session {
    if (!findCondition(conditionId)) {
      throw new Error(`Unknown condition id: ${conditionId}`);
    }
    return this.stateManager.createSession(conditionId);
  }

  greet(sessionId: string): AgentResponse {
    const session = this.stateManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Unknown session id: ${sessionId}`);
    }
    const condition = findCondition(session.conditionId);
    if (!condition) {
      throw new Error(`Unknown condition id: ${session.conditionId}`);
    }

    const text =
      `Hi, I'm here to help you understand your ${condition.name.toLowerCase()}. ` +
      "What would you like to know?";

    this.stateManager.addTurn(sessionId, {
      role: "agent",
      content: text,
      timestamp: new Date().toISOString(),
    });

    return {
      text,
      citations: [],
      confidence: 1,
      safety: { verdict: "PASS", reasons: [], matchedPatterns: [] },
      latencyMs: 0,
      conditionId: condition.id,
    };
  }

  async ask(sessionId: string, userInput: string): Promise<AgentResponse> {
    const start = Date.now();
    const session = this.stateManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Unknown session id: ${sessionId}`);
    }
    const condition = findCondition(session.conditionId);
    if (!condition) {
      throw new Error(`Unknown condition id: ${session.conditionId}`);
    }

    this.stateManager.addTurn(sessionId, {
      role: "user",
      content: userInput,
      timestamp: new Date().toISOString(),
    });

    const inputSafety = checkUserInputSafety(userInput);
    if (inputSafety.verdict === "ESCALATE") {
      return this.finalize(sessionId, condition.id, EMERGENCY_RESPONSE, [], 0.99, inputSafety, start);
    }
    if (inputSafety.verdict === "BLOCKED") {
      return this.finalize(
        sessionId,
        condition.id,
        PRESCRIBING_DECLINE_RESPONSE,
        [],
        0.99,
        inputSafety,
        start
      );
    }

    const relevantFacts = findRelevantFacts(condition.id, userInput);
    const citations: Citation[] = relevantFacts.flatMap((f) => f.citations);

    const text = await this.reasoningEngine.generateResponse(condition, userInput, session.turns);

    const responseSafety = checkResponseSafety(text);
    if (responseSafety.verdict === "BLOCKED") {
      return this.finalize(
        sessionId,
        condition.id,
        "I want to make sure I give you safe, accurate information, so I'm going to hold back on that specific detail. Please check with your doctor or pharmacist, and let me know if there's something else about your condition I can help explain.",
        [],
        0.5,
        responseSafety,
        start
      );
    }

    const confidence = citations.length > 0 ? 0.9 + Math.min(citations.length, 3) * 0.01 : 0.75;

    return this.finalize(sessionId, condition.id, text, dedupeCitations(citations), confidence, responseSafety, start);
  }

  async *askStream(sessionId: string, userInput: string): AsyncGenerator<StreamEvent> {
    const start = Date.now();
    const session = this.stateManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Unknown session id: ${sessionId}`);
    }
    const condition = findCondition(session.conditionId);
    if (!condition) {
      throw new Error(`Unknown condition id: ${session.conditionId}`);
    }

    this.stateManager.addTurn(sessionId, {
      role: "user",
      content: userInput,
      timestamp: new Date().toISOString(),
    });

    const inputSafety = checkUserInputSafety(userInput);
    if (inputSafety.verdict === "ESCALATE") {
      const response = this.finalize(sessionId, condition.id, EMERGENCY_RESPONSE, [], 0.99, inputSafety, start);
      yield { type: "chunk", text: response.text };
      yield { type: "done", response };
      return;
    }
    if (inputSafety.verdict === "BLOCKED") {
      const response = this.finalize(
        sessionId,
        condition.id,
        PRESCRIBING_DECLINE_RESPONSE,
        [],
        0.99,
        inputSafety,
        start
      );
      yield { type: "chunk", text: response.text };
      yield { type: "done", response };
      return;
    }

    const relevantFacts = findRelevantFacts(condition.id, userInput);
    const citations = dedupeCitations(relevantFacts.flatMap((f) => f.citations));

    let buffer = "";
    let fullText = "";
    let blocked = false;
    const sentenceEnd = /[.!?](\s|$)/;

    for await (const delta of this.reasoningEngine.streamResponse(condition, userInput, session.turns)) {
      if (blocked) continue;
      buffer += delta;
      fullText += delta;

      let match: RegExpExecArray | null;
      while (!blocked && (match = sentenceEnd.exec(buffer))) {
        const idx = match.index + match[0].length;
        const sentence = buffer.slice(0, idx);
        buffer = buffer.slice(idx);

        if (checkResponseSafety(fullText).verdict === "BLOCKED") {
          blocked = true;
          break;
        }
        yield { type: "chunk", text: sentence };
      }
    }

    if (!blocked && buffer.trim() && checkResponseSafety(fullText).verdict !== "BLOCKED") {
      yield { type: "chunk", text: buffer };
    } else if (!blocked) {
      blocked = checkResponseSafety(fullText).verdict === "BLOCKED";
    }

    if (blocked) {
      yield { type: "blocked" };
      const response = this.finalize(
        sessionId,
        condition.id,
        "I want to make sure I give you safe, accurate information, so I'm going to hold back on that specific detail. Please check with your doctor or pharmacist, and let me know if there's something else about your condition I can help explain.",
        [],
        0.5,
        checkResponseSafety(fullText),
        start
      );
      yield { type: "done", response };
      return;
    }

    const confidence = citations.length > 0 ? 0.9 + Math.min(citations.length, 3) * 0.01 : 0.75;
    const response = this.finalize(
      sessionId,
      condition.id,
      fullText,
      citations,
      confidence,
      { verdict: "PASS", reasons: [], matchedPatterns: [] },
      start
    );
    yield { type: "done", response };
  }

  private finalize(
    sessionId: string,
    conditionId: string,
    text: string,
    citations: Citation[],
    confidence: number,
    safety: AgentResponse["safety"],
    start: number
  ): AgentResponse {
    this.stateManager.addTurn(sessionId, {
      role: "agent",
      content: text,
      timestamp: new Date().toISOString(),
    });

    return {
      text,
      citations,
      confidence,
      safety,
      latencyMs: Date.now() - start,
      conditionId,
    };
  }

  getSession(sessionId: string): Session | undefined {
    return this.stateManager.getSession(sessionId);
  }

  close(): void {
    this.stateManager.close();
  }
}

function dedupeCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  return citations.filter((c) => {
    if (seen.has(c.source)) return false;
    seen.add(c.source);
    return true;
  });
}
