import readline from "readline";
import { assertApiKey } from "./utils/config";
import { MEDICAL_KB } from "./services/medical-kb";
import { VoiceAgent } from "./services/voice-agent";

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main(): Promise<void> {
  assertApiKey();

  console.log("═".repeat(63));
  console.log("Healthcare Patient Education Voice Agent - Interactive Demo");
  console.log("═".repeat(63));
  console.log("\nAvailable conditions:");
  MEDICAL_KB.forEach((c, i) => console.log(`  ${i + 1}. ${c.name}`));

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const agent = new VoiceAgent();

  try {
    const choice = await prompt(rl, `\nChoose a condition (1-${MEDICAL_KB.length}): `);
    const index = parseInt(choice, 10) - 1;
    const condition = MEDICAL_KB[index];
    if (!condition) {
      console.log("Invalid choice.");
      return;
    }
    console.log(`\nYou selected: ${condition.name}\n`);

    const session = agent.startSession(condition.id);

    let ongoing = true;
    while (ongoing) {
      const userInput = await prompt(rl, "You (or 'quit' to end): ");
      if (userInput.trim().toLowerCase() === "quit") {
        ongoing = false;
        break;
      }

      console.log(`\nUSER: ${userInput}\n`);
      const response = await agent.ask(session.id, userInput);
      console.log(`AGENT: ${response.text}\n`);
      console.log("─".repeat(63));
      console.log("RESPONSE METRICS:");
      console.log(`  Safety Check:  ${response.safety.verdict === "PASS" ? "PASSED" : response.safety.verdict}`);
      console.log(`  Citations:     ${response.citations.length} source(s)${response.citations.length ? " (" + response.citations.map((c) => c.source).join(", ") + ")" : ""}`);
      console.log(`  Confidence:    ${response.confidence.toFixed(2)}`);
      console.log(`  Latency:       ${(response.latencyMs / 1000).toFixed(1)}s`);
      console.log("─".repeat(63) + "\n");
    }

    console.log(`\nCONVERSATION SAVED TO DATABASE (Session: ${session.id})\n`);
  } finally {
    rl.close();
    agent.close();
  }
}

main().catch((err) => {
  console.error("Demo failed:", err.message ?? err);
  process.exit(1);
});
