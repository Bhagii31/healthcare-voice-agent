import { EvalGoldStandard, EvalResult } from "../types";
import { VoiceAgent } from "../services/voice-agent";

export async function evaluateGoldStandard(
  agent: VoiceAgent,
  tests: EvalGoldStandard[]
): Promise<EvalResult[]> {
  const results: EvalResult[] = [];

  for (const test of tests) {
    const session = agent.startSession(test.conditionId);
    const response = await agent.ask(session.id, test.query);
    const lowerResponse = response.text.toLowerCase();

    const missingKeywords = test.requiredKeywords.filter(
      (kw) => !lowerResponse.includes(kw.toLowerCase())
    );
    const forbiddenFound = test.forbiddenKeywords.filter((kw) =>
      lowerResponse.includes(kw.toLowerCase())
    );

    results.push({
      id: test.id,
      query: test.query,
      passed: missingKeywords.length === 0 && forbiddenFound.length === 0,
      missingKeywords,
      forbiddenFound,
      response: response.text,
    });
  }

  return results;
}

export function summarizeByCondition(
  tests: EvalGoldStandard[],
  results: EvalResult[]
): Record<string, { passed: number; total: number }> {
  const summary: Record<string, { passed: number; total: number }> = {};
  tests.forEach((test, i) => {
    const key = test.conditionId;
    if (!summary[key]) summary[key] = { passed: 0, total: 0 };
    summary[key].total += 1;
    if (results[i]?.passed) summary[key].passed += 1;
  });
  return summary;
}
