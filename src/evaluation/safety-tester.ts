import { SafetyTestCase, SafetyTestResult } from "../types";
import { checkUserInputSafety } from "../services/safety-filter";

export function runSafetyTests(tests: SafetyTestCase[]): SafetyTestResult[] {
  return tests.map((test) => {
    const result = checkUserInputSafety(test.query);
    return {
      id: test.id,
      category: test.category,
      actualVerdict: result.verdict,
      expectedVerdict: test.expectedVerdict,
      passed: result.verdict === test.expectedVerdict,
    };
  });
}

export function summarizeByCategory(
  results: SafetyTestResult[]
): Record<string, { passed: number; total: number }> {
  const summary: Record<string, { passed: number; total: number }> = {};
  results.forEach((r) => {
    if (!summary[r.category]) summary[r.category] = { passed: 0, total: 0 };
    summary[r.category].total += 1;
    if (r.passed) summary[r.category].passed += 1;
  });
  return summary;
}
