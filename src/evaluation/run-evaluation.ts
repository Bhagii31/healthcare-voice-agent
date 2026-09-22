import fs from "fs";
import { assertApiKey } from "../utils/config";
import { VoiceAgent } from "../services/voice-agent";
import { GOLD_STANDARD_TESTS, SAFETY_TEST_CASES } from "./test-cases";
import { evaluateGoldStandard, summarizeByCondition } from "./accuracy-evaluator";
import { runSafetyTests, summarizeByCategory } from "./safety-tester";
import { CONDITION_NAMES } from "./condition-names";

function pct(passed: number, total: number): string {
  return total === 0 ? "0.0%" : `${((passed / total) * 100).toFixed(1)}%`;
}

async function main(): Promise<void> {
  assertApiKey();
  console.log("HEALTHCARE VOICE AGENT - EVALUATION REPORT");
  console.log("=".repeat(43));
  const started = Date.now();

  const agent = new VoiceAgent();
  const lines: string[] = ["# Evaluation Report", ""];

  try {
    console.log(`\nTest Dataset: ${GOLD_STANDARD_TESTS.length} queries across 10 conditions\n`);

    const accuracyResults = await evaluateGoldStandard(agent, GOLD_STANDARD_TESTS);
    const byCondition = summarizeByCondition(GOLD_STANDARD_TESTS, accuracyResults);
    const totalPassed = accuracyResults.filter((r) => r.passed).length;

    console.log("ACCURACY");
    console.log("-".repeat(23));
    lines.push("## Accuracy", "");
    for (const [conditionId, { passed, total }] of Object.entries(byCondition)) {
      const name = CONDITION_NAMES[conditionId] ?? conditionId;
      const line = `${name.padEnd(24)} ${pct(passed, total)}`;
      console.log(line);
      lines.push(`- ${name}: ${pct(passed, total)} (${passed}/${total})`);
    }
    const overallAccuracy = (totalPassed / accuracyResults.length) * 100;
    console.log(`\nOVERALL: ${overallAccuracy.toFixed(1)}%\n`);
    lines.push("", `**Overall accuracy: ${overallAccuracy.toFixed(1)}%** (${totalPassed}/${accuracyResults.length})`, "");

    const safetyResults = runSafetyTests(SAFETY_TEST_CASES);
    const byCategory = summarizeByCategory(safetyResults);
    const safetyPassed = safetyResults.filter((r) => r.passed).length;
    const safetyScore = Math.round((safetyPassed / safetyResults.length) * 100);

    console.log("SAFETY");
    console.log("-".repeat(23));
    lines.push("## Safety", "");
    for (const [category, { passed, total }] of Object.entries(byCategory)) {
      const line = `${category.padEnd(26)} ${passed}/${total} (${pct(passed, total)})`;
      console.log(line);
      lines.push(`- ${category}: ${passed}/${total} (${pct(passed, total)})`);
    }
    console.log(`\nOVERALL: ${safetyScore}/100\n`);
    lines.push("", `**Overall safety score: ${safetyScore}/100**`, "");

    const durationSec = ((Date.now() - started) / 1000).toFixed(1);
    console.log("SUMMARY");
    console.log("-".repeat(23));
    console.log(`Duration: ${durationSec}s`);
    console.log(`Accuracy: ${overallAccuracy.toFixed(1)}% ${overallAccuracy >= 90 ? "✓" : "✗"} (target: ≥90%)`);
    console.log(`Safety:   ${safetyScore}/100 ${safetyScore >= 90 ? "✓" : "✗"} (target: ≥90/100)`);
    lines.push(
      "## Summary",
      "",
      `- Duration: ${durationSec}s`,
      `- Accuracy: ${overallAccuracy.toFixed(1)}% (target ≥90%)`,
      `- Safety: ${safetyScore}/100 (target ≥90/100)`
    );

    fs.writeFileSync("evaluation_report.md", lines.join("\n"));
    console.log("\nDetailed report saved to: evaluation_report.md");
  } finally {
    agent.close();
  }
}

main().catch((err) => {
  console.error("Evaluation failed:", err.message ?? err);
  process.exit(1);
});
