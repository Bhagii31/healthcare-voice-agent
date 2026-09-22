import { SafetyResult } from "../types";

const EMERGENCY_PATTERNS: RegExp[] = [
  /chest pain/i,
  /can'?t breathe|cannot breathe|difficulty breathing/i,
  /suicid|kill myself|end my life|want(ed|ing)? to die|thinking about dying|don'?t want to (be alive|live)/i,
  /overdose/i,
  /stroke|face (is |feels )?drooping|(slurred|slurring) speech|speech (feels|is|sounds).*slurr/i,
  /severe bleeding|won'?t stop bleeding/i,
  /allergic reaction.*(throat|swelling|breathing)/i,
];

const PRESCRIBING_PATTERNS: RegExp[] = [
  /how much .{0,30}should i take/i,
  /how much (should i|do i) take/i,
  /what('s| is) (the )?(maximum |safe |right |correct )?dos(e|age)|what dose|what dosage|maximum (safe )?dose|dosage estimate|rough dose|ballpark dose/i,
  /(prescribe|give) me (a |some )?(medication|drug|pill|something|anything)/i,
  /should i (take|stop taking|increase|decrease).*(dose|medication|pills?)/i,
  /can you diagnose me/i,
];

const MISINFORMATION_PATTERNS: RegExp[] = [
  /vaccines cause autism/i,
  /essential oils cure/i,
  /cancer.*(cured by|cure with) (diet|juice|alkaline)/i,
  /diabetes isn'?t real|diabetes is a myth/i,
];

function collectMatches(text: string, patterns: RegExp[]): string[] {
  return patterns.filter((p) => p.test(text)).map((p) => p.source);
}

export function checkUserInputSafety(userInput: string): SafetyResult {
  const emergencyMatches = collectMatches(userInput, EMERGENCY_PATTERNS);
  if (emergencyMatches.length > 0) {
    return {
      verdict: "ESCALATE",
      reasons: [
        "User input matches emergency symptom patterns. This requires immediate medical attention, not a chatbot response.",
      ],
      matchedPatterns: emergencyMatches,
    };
  }

  const prescribingMatches = collectMatches(userInput, PRESCRIBING_PATTERNS);
  if (prescribingMatches.length > 0) {
    return {
      verdict: "BLOCKED",
      reasons: [
        "User is requesting specific dosing, prescribing, or diagnostic advice, which this agent cannot provide.",
      ],
      matchedPatterns: prescribingMatches,
    };
  }

  return { verdict: "PASS", reasons: [], matchedPatterns: [] };
}

export function checkResponseSafety(responseText: string): SafetyResult {
  const misinfoMatches = collectMatches(responseText, MISINFORMATION_PATTERNS);
  if (misinfoMatches.length > 0) {
    return {
      verdict: "BLOCKED",
      reasons: ["Generated response contains flagged misinformation patterns."],
      matchedPatterns: misinfoMatches,
    };
  }

  const dosagePattern = /\b\d+\s?(mg|milligrams|ml|units)\b.*\b(take|dose|daily|twice)\b/i;
  if (dosagePattern.test(responseText)) {
    return {
      verdict: "BLOCKED",
      reasons: ["Generated response includes specific dosing instructions, which should come from a doctor."],
      matchedPatterns: [dosagePattern.source],
    };
  }

  return { verdict: "PASS", reasons: [], matchedPatterns: [] };
}

export const EMERGENCY_RESPONSE =
  "This sounds like it could be a medical emergency. Please call 911 (or your local emergency number) " +
  "right away, or go to the nearest emergency room. I'm not able to help with emergencies — please seek " +
  "immediate in-person care.";

export const PRESCRIBING_DECLINE_RESPONSE =
  "I can't provide specific dosing, prescribing, or diagnostic advice — that needs to come from your doctor " +
  "or pharmacist, who knows your full medical history. I'm happy to explain general information about your " +
  "condition instead. Would that help?";
