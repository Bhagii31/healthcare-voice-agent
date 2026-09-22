import { MEDICAL_KB } from "../services/medical-kb";

export const CONDITION_NAMES: Record<string, string> = Object.fromEntries(
  MEDICAL_KB.map((c) => [c.id, c.name])
);
