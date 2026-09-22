import { checkUserInputSafety, checkResponseSafety } from "../services/safety-filter";
import { findCondition, findRelevantFacts, MEDICAL_KB } from "../services/medical-kb";
import { StateManager } from "../services/state-manager";

export interface TestCase {
  name: string;
  run: () => void | Promise<void>;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export const unitTests: TestCase[] = [
  {
    name: "safety-filter: emergency chest pain triggers ESCALATE",
    run: () => {
      const result = checkUserInputSafety("I have severe chest pain right now");
      assert(result.verdict === "ESCALATE", `Expected ESCALATE, got ${result.verdict}`);
    },
  },
  {
    name: "safety-filter: dosage question triggers BLOCKED",
    run: () => {
      const result = checkUserInputSafety("How much metformin should I take?");
      assert(result.verdict === "BLOCKED", `Expected BLOCKED, got ${result.verdict}`);
    },
  },
  {
    name: "safety-filter: normal question passes",
    run: () => {
      const result = checkUserInputSafety("What is type 2 diabetes?");
      assert(result.verdict === "PASS", `Expected PASS, got ${result.verdict}`);
    },
  },
  {
    name: "safety-filter: response with dosage instructions is blocked",
    run: () => {
      const result = checkResponseSafety("You should take 500 mg twice daily.");
      assert(result.verdict === "BLOCKED", `Expected BLOCKED, got ${result.verdict}`);
    },
  },
  {
    name: "medical-kb: all 10 conditions are present",
    run: () => {
      assert(MEDICAL_KB.length === 10, `Expected 10 conditions, got ${MEDICAL_KB.length}`);
    },
  },
  {
    name: "medical-kb: findCondition returns correct condition",
    run: () => {
      const condition = findCondition("asthma");
      assert(condition?.name === "Asthma", "Expected to find Asthma condition");
    },
  },
  {
    name: "medical-kb: findRelevantFacts matches keywords",
    run: () => {
      const facts = findRelevantFacts("type2-diabetes", "What foods should I avoid, high in sugar?");
      assert(facts.length > 0, "Expected at least one relevant fact");
    },
  },
  {
    name: "state-manager: creates and retrieves a session with turns",
    run: () => {
      const sm = new StateManager(":memory:");
      const session = sm.createSession("hypertension");
      sm.addTurn(session.id, { role: "user", content: "hello", timestamp: new Date().toISOString() });
      const fetched = sm.getSession(session.id);
      assert(fetched?.turns.length === 1, "Expected 1 turn in session");
      sm.close();
    },
  },
];
