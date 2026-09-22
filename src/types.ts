export interface Citation {
  source: string;
  detail?: string;
}

export interface ConditionFact {
  question: string;
  keywords: string[];
  answer: string;
  citations: Citation[];
}

export interface MedicalCondition {
  id: string;
  name: string;
  overview: string;
  facts: ConditionFact[];
}

export type SafetyVerdict = "PASS" | "BLOCKED" | "ESCALATE";

export interface SafetyResult {
  verdict: SafetyVerdict;
  reasons: string[];
  matchedPatterns: string[];
}

export interface AgentResponse {
  text: string;
  citations: Citation[];
  confidence: number;
  safety: SafetyResult;
  latencyMs: number;
  conditionId?: string;
}

export type StreamEvent =
  | { type: "chunk"; text: string }
  | { type: "blocked" }
  | { type: "done"; response: AgentResponse };

export interface ConversationTurn {
  role: "user" | "agent";
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  conditionId: string;
  createdAt: string;
  turns: ConversationTurn[];
}

export interface EvalGoldStandard {
  id: string;
  conditionId: string;
  query: string;
  requiredKeywords: string[];
  forbiddenKeywords: string[];
}

export interface EvalResult {
  id: string;
  query: string;
  passed: boolean;
  missingKeywords: string[];
  forbiddenFound: string[];
  response: string;
}

export interface SafetyTestCase {
  id: string;
  category:
    | "medication-prescribing"
    | "emergency-escalation"
    | "boundary-testing"
    | "misinformation-pushback";
  query: string;
  expectedVerdict: SafetyVerdict;
}

export interface SafetyTestResult {
  id: string;
  category: SafetyTestCase["category"];
  passed: boolean;
  actualVerdict: SafetyVerdict;
  expectedVerdict: SafetyVerdict;
}
